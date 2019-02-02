/* eslint-disable camelcase,max-len */
'use strict';

module.exports = function(Company) {
  Company.getReport = function(id, callback) {
    let payload = getPayloadModel();
    let finishedCount = 0;
    const BUY_INDEX = 0;
    const SELL_INDEX = 1;
    const resourcesRequested = 4;

    Company.getApp((err, app) => {
      let transactionModel = app.models.TransactionData;
      let productModel = app.models.ProductData;
      let employeeModel = app.models.EmployeeData;
      let usernModel = app.models.Client;

      const transactionFilter = {
        where: {company_id: id},
        order: 'date ASC',
        fields: {_rev: false, company_id: false, id: false, description: false},
      };

      const productFilter = {
        where: {company_id: id},
        order: 'date ASC',
        fields: {_rev: false, company_id: false, id: false, description: false},
      };

      const employeeFilter = {
        where: {company_id: id},
        order: 'date ASC',
        fields: {
          _rev: false,
          company_id: false,
          id: false,
        },
      };

      const userFilter = {
        where: {company_id: id},
        fields: {_rev: false, company_id: false, id: false, description: false},
      };

      transactionModel.find(transactionFilter, transactionsCallback);

      // setTimeout(() => {
      usernModel.find(userFilter, userCallback);
      // }, 500);

      // setTimeout(() => {
      productModel.find(productFilter, productCallback);
      // }, 500);

      employeeModel.find(employeeFilter, employeeCallback);
    });

    function employeeCallback(err, employees) {
      if (err) {
        payload = err;
        finish(true);
      }

      if (!employees.length) {
        finish();
      }

      employees = employees.map(mapEmployee);
      payload.data.employees = employees.slice();
      payload.summary.employees.amount = employees.length;
      payload.summary.employees.departments = employees.map(mapDepartments).filter(uniqueDepartments).length;
      payload.graph.employees.employeesByDay = [{
        name: 'Number of Employees',
        series: getSameDayProperty(employees, 'total_employees', 0),
      }];
      payload.graph.employees.teamsByDay = [{
        name: 'Number of Teams',
        series: getSameDayProperty(employees, 'total_teams', 0),
      }];
      payload.graph.employees.salaryByDay = [{
        name: 'Total Salary',
        series: getSameDayProperty(employees, 'total_salary_paid', 2),
      }];
      payload.graph.employees.thisYearSalaryByDepartment = getSameFieldProperty(
        employees.filter(filterThisYearEmployees),
        'department',
        'total_salary_paid',
        2).filter(filterNotEmptyvalue);
      finish();
    }

    function productCallback(err, products) {
      if (err) {
        payload = err;
        finish(true);
      }

      if (!products.length) {
        finish();
      }

      products = products.map(mapProduct);

      payload.data.products = products;
      payload.summary.products.amount = products.length;
      payload.graph.products.stockByDay = [{
        name: 'Stock',
        series: getSameDayProperty(products, 'current_stock', 0),
      }];
      payload.graph.products.valueByDay = [{
        name: 'Value',
        series: getSameDayProperty(products, 'current_value', 2),
      }];
      payload.graph.products.stockByCategory = getSameFieldProperty(products.slice(), 'category', 'current_stock', 0);
      payload.graph.products.valueByCategory = getSameFieldProperty(products.slice(), 'category', 'current_value', 2);
      finish();
    }

    function userCallback(err, users) {
      if (err) {
        payload = err;
        finish(true);
      }

      payload.data.users = users;
      payload.summary.users.amount = users.length;
      finish();
    }

    function transactionsCallback(err, transactions) {
      if (err) {
        payload = err;
        finish(true);
      }

      if (!transactions.length) {
        finish();
      }

      transactions = transactions.map(mapTransactions);

      let buySellArray = getArrayBuySell(transactions);

      payload.data.transactions = transactions;
      payload.graph.transactions.valueByDay = [{
        name: 'Buy',
        series: sumSameDayTransactions(buySellArray[BUY_INDEX]),
      }, {
        name: 'Sell',
        series: sumSameDayTransactions(buySellArray[SELL_INDEX]),
      }];
      payload.graph.transactions.amountByDay = [{
        name: 'Buy',
        series: countSameDayTransactions(buySellArray[BUY_INDEX]),
      }, {
        name: 'Sell',
        series: countSameDayTransactions(buySellArray[SELL_INDEX]),
      }];
      payload.summary.transactions.countSell = buySellArray[SELL_INDEX].length;
      payload.summary.transactions.countBuy = buySellArray[BUY_INDEX].length;
      payload.summary.transactions.valueBuy = sumValue(payload.graph.transactions.valueByDay[BUY_INDEX].series, 'value');
      payload.summary.transactions.valueSell = sumValue(payload.graph.transactions.valueByDay[SELL_INDEX].series, 'value');
      finish();
    }

    function countInstances(array, field, value) {
      let count = 0;
      array.forEach(element => {
        if (element[field] != null && element[field] === value) {
          count++;
        }
      });
      return count;
    }

    function uniqueDepartments(department, index, self) {
      return self.indexOf(department) === index;
    }

    function filterThisYearEmployees(employee) {
      const year = new Date().getFullYear();
      return employee.year = year;
    }

    function filterNotEmptyvalue(element) {
      return parseFloat(element.value) !== 0;
    }

    function mapTransactions(transaction) {
      transaction.dateStr = getStrDate(transaction.date);
      return transaction;
    }

    function mapProduct(product) {
      product.dateStr = getStrDate(product.date);
      return product;
    }

    function mapDepartments(employee) {
      return employee.department;
    }

    function mapEmployee(employee) {
      employee.year = employee.date.getFullYear();
      employee.dateStr = (employee.date.getMonth() + 1) + '/' + employee.date.getFullYear();
      return employee;
    }

    function getStrDate(date) {
      return date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();
    }

    function getSameFieldProperty(array, groupByField, property, digits) {
      const newArray = [];
      const fields = [];

      newArray.push({
        name: array[0][groupByField],
        value: array[0][property].toFixed(digits),
      });
      fields.push(array[0][groupByField]);
      array.slice(1).forEach((element) => {
        let index = fields.indexOf(element[groupByField]);
        // console.log(property, index, categories);
        if (index !== -1) {
          newArray[index].value = (parseFloat(newArray[index].value) + parseFloat(element[property])).toFixed(digits);
        } else {
          newArray.push({
            name: element[groupByField],
            value: element[property].toFixed(digits),
          });
          fields.push(element[groupByField]);
        }
      });

      return newArray;
    }

    function getSameDayProperty(array, property, digits) {
      const newArray = [];
      let index = 0;

      newArray.push({
        name: array[0].dateStr,
        value: array[0][property].toFixed(digits),
      });
      array.slice(1).forEach((element) => {
        if (newArray[index].name === element.dateStr) {
          // console.log(newArray[index].value, parseFloat(newArray[index].value), parseFloat(element[property]));
          // console.log(property, element[property], element.current_stock, element.current_value);
          newArray[index].value = (parseFloat(newArray[index].value) + parseFloat(element[property])).toFixed(digits);
        } else {
          index++;
          newArray.push({
            name: element.dateStr,
            value: element[property].toFixed(digits),
          });
        }
      });

      return newArray;
    }

    function getArrayBuySell(transactions) {
      let array = [[], []];
      transactions.forEach(transaction => {
        const obj = {
          name: transaction.dateStr,
          value: parseFloat(transaction.value).toFixed(2),
        };
        const index = transaction.type === 'Buy' ? BUY_INDEX : SELL_INDEX;
        array[index].push(obj);
      });

      return array;
    }

    function countSameDayTransactions(array) {
      const countArray = [];
      let index = 0;

      countArray.push({
        name: array[0].name,
        value: array[0].value,
      });
      countArray[0].value = 1;
      array.slice(1).forEach((element) => {
        if (countArray[index].name === element.name) {
          countArray[index].value++;
        } else {
          index++;
          countArray.push({
            name: element.name,
            value: element.value,
          });
          countArray[index].value = 1;
        }
      });

      return countArray;
    }

    function sumSameDayTransactions(array) {
      const newArray = [];
      let newArrayIndex = 0;

      newArray.push(array[0]);
      array.slice(1).forEach((element) => {
        if (newArray[newArrayIndex].name === element.name) {
          newArray[newArrayIndex].value = (parseFloat(newArray[newArrayIndex].value) + parseFloat(element.value)).toFixed(2);
        } else {
          newArrayIndex++;
          newArray.push(element);
        }
      });

      return newArray;
    }

    function sumValue(array, field) {
      let value = 0;

      for (let i = 0; i < array.length; i++) {
        value += parseFloat(array[i][field]);
      }

      return (value).toFixed(2);
    }

    function finish(err) {
      finishedCount++;

      if (err || finishedCount === resourcesRequested) {
        callback(null, payload);
      }
    }

    function getPayloadModel() {
      return {
        graph: {
          transactions: {
            valueByDay: [],
            amountByDay: [],
          },
          employees: {
            teamsByDay: [],
            employeesByDay: [],
            salaryByDay: [],
            thisYearSalaryByDepartment: [],
          },
          products: {
            stockByDay: [],
            valueByDay: [],
            stockByCategory: [],
            valueByCategory: [],
          },
        },
        data: {
          transactions: [],
          employees: [],
          products: [],
          users: [],
        },
        summary: {
          transactions: {
            countSell: 0,
            countBuy: 0,
            valueSell: 0,
            valueBuy: 0,
          },
          employees: {
            departments: 0,
            amount: 0,
          },
          products: {
            amount: 0,
          },
          users: {
            // owners: 0,
            // managers: 0,
            amount: 0,
          },
        },
      };
    }
  };

  Company.remoteMethod('getReport', {
    http: {path: '/report', verb: 'get'},
    accepts: {arg: 'id', type: 'string'},
    returns: {arg: 'payload', type: 'Object'},
  });
};
