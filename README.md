# BI-REST API Loopback Application

This project was developed for the course assignment of the 2018-2019 edition of the Vrije Universiteit Amsterdam, Computer Science Master Degree, Developing Services to the Cloud course.

This API is consumed by our [Angular application](https://git.eu-gb.bluemix.net/w.genizshann/bi-angular) and is intended to be used as a complement of companies internal applications, providing insights into the company business. In this first version, we provide an analysis regarding the transactions, products and employees.

## Features

- Manage companies.
- Manage companies users.
- Manage data categories (Currently we have data related to Products, Employees and Transactions).
- Generate a JSON report of all the data of a company.

## Technologies

This project utilizes the [Loopback](https://loopback.io/) framework to create well-defined REST APIs and [IBM Cloudant](https://www.ibm.com/cloud/cloudant) database to store the data. 

The [Underscore](https://underscorejs.org/) library is also used. 

## API

You can access the API on the [test environment](https://toolchain-dsc-bi.eu-gb.mybluemix.net/explorer/) or in the [IBM API Connect Portal](https://sb-wgenizshannstudentvunl-vuspace.developer.eu-gb.apiconnect.appdomain.cloud/). You can use the credentials ``mr.test@test.com``email and ``test`` password.

## Architecture

You can check the API architecture and main features in the [UseCase Diagram](docs/UC_diagram.png) and [Class Diagram](docs/Class_diagram.png).

## Hooks and Remote Methods

This project has 2 remote methods and 1 hook for built-in model:

### Remote Method 1

Route: ``/api/users/roles?id``

Receives a user id

Return the roles of the user with the provided id. 

The code for this was provided by  [zhenyanghua gist](https://gist.github.com/zhenyanghua/d24ea57cd70e69bcb82dc3bc8f14ea74) and was slightly modified to add timeouts between each request.

### Remote Method 2

Route: ``/api/companies/report?id``

Receives a company ID

Return an object containing all the company data, a summary of it and data structured to be plotted in charts.

This is the most complex API implemented in this project, presenting data for 4 resources: Products, Users, Employees and Transactions. It can be divided into 3 steps:

- Retrieve the data in the database.
- Calculate summary for each resource.
- Calculate graph data for each resource.

### Hook 1

Resource: Users (Clients)

method: afterSave

When creating a new user, map the new user with its designed role by adding a new RoleMapping object.

## Possible Improvements:

- Add remote hooks to delete all data models related to the company in the case the company is deleted.
- Add remote hooks to delete the RoleMapping model associated with the User model if the user is deleted. 
- Refactor the remote method report for better readability and organization.
- Add more data categories resources.