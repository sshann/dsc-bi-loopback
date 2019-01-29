/* eslint-disable camelcase,max-len */
'use strict';

module.exports = function(Company) {
  Company.getReport = function(id, callback) {
    let payload = getPayloadModel();
    let finishedCount = 0;
    const BUY_INDEX = 0;
    const SELL_INDEX = 1;

    Company.getApp((err, app) => {
      let transactionModel = app.models.TransactionData;

      const transactionFilter = {
        where: {company_id: id},
        order: 'date ASC',
        fields: {_rev: false, company_id: false, id: false, description: false},
      };

      transactionModel.find(transactionFilter, transactionsCallback);
    });

    function transactionsCallback(err, transactions) {
      if (err) {
        payload = err;
        finish(true);
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

    function mapTransactions(transaction) {
      transaction.dateStr = transaction.date.getDate() + '/' + (transaction.date.getMonth() + 1) + '/' + transaction.date.getFullYear();
      return transaction;
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

      countArray.push(array[0]);
      countArray[0].value = 1;
      array.slice(1).forEach((element) => {
        if (countArray[index].name === element.name) {
          countArray[index].value++;
        } else {
          index++;
          countArray.push(element);
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

      if (err || finishedCount === 1) {
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
          employee: {},
          products: {},
        },
        data: {
          transactions: [],
          employee: [],
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
            owners: 0,
            managers: 0,
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
