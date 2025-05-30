# webdriverio-expandtesting_api_and_web

API and WEB testing in [expandtesting](https://practice.expandtesting.com/notes/app/) notes app. This project contains basic examples on how to use WebdriverIO to test API, WEB and how to combine API and WEB tests. Good practices such as hooks, custom commands and tags, among others, are used. All the necessary support documentation to develop this project is placed here. When it comes to the API part, it deals with the x-www-form-urlencoded content type. Although custom commands are used, the assertion code to each test is kept in it so we can work independently in each test. It creates one .json file for each test so we can share data between different requests in the test. The .json file is excluded after each test execution.  

# Pre-requirements:

| Requirement                   | Version | Note                                                            |
| :---------------------------- |:--------| :---------------------------------------------------------------|
| Node.js                       | 22.11.0 |                                                                 |
| Visual Studio Code            | 1.100.2 |                                                                 |
| WebdriverIO                   | 9.14.0  |                                                                 |
| dotenv                        | 16.5.0  |                                                                 |
| wdio-intercept-service        | 4.4.1   |                                                                 |
| @wdio/allure-reporter         | 9.14.0  |                                                                 |
| @faker-js/faker               | 9.8.0   |                                                                 |
| supertest                     | 7.1.1   |                                                                 |

# Installation:

- See [Node.js page](https://nodejs.org/en) and install the aforementioned Node.js version. Keep all the preferenced options as they are.
- Open the terminal, navigate to the project directory (e.g. C:\webdriverio-expandtesting_api_and_web) and execute the ```npm init wdio@latest . -- --yes``` command to start a project. 
- See [Visual Studio Code page](https://code.visualstudio.com/) and install the latest VSC stable version. Keep all the prefereced options as they are until you reach the possibility to check the checkboxes below: 
  - :white_check_mark: Add "Open with code" action to Windows Explorer file context menu. 
  - :white_check_mark: Add "Open with code" action to Windows Explorer directory context menu.
Check then both to add both options in context menu.
- Execute ```npm install dotenv``` to install dotenv.
- Execute ```npm install wdio-intercept-service -D``` to install dotenv.
- Execute ```npm install --save-dev @wdio/allure-reporter allure-commandline``` to @wdio/allure-reporter.
- Execute ```npm install @faker-js/faker --save-dev``` to install faker library.
- Execute ```npm install supertest``` to install supertest library.

# Tests:

- Execute ```npx wdio run wdio.conf.js``` to execute all tests. 
- Execute ```npx wdio run wdio.conf.js --watch``` to execute all tests and keep the browser open. 
- Execute ```npx wdio run wdio.conf.js --spec test/specs/web/users_web.e2e.js``` to execute all tests in the users_web.e2e.js file. 
- Configure the desired test like ```it.only``` and execute ```npx wdio run wdio.conf.js --spec test/specs/web/users_web.e2e.js``` to execute only the desired test in the users_web.e2e.js file.
- Execute the command block below to run all the tests, generate and open allure-report.
  ```
    npx wdio run wdio.conf.js
    npx allure generate reports/allure-results --clean -o reports/allure-report
    npx allure open reports/allure-report
  ```

# Support:

- [expandtesting API documentation page](https://practice.expandtesting.com/notes/api/api-docs/)
- [expandtesting API demonstration page](https://www.youtube.com/watch?v=bQYvS6EEBZc)
- [Faker](https://fakerjs.dev/guide/)
- [Getting Started](https://webdriver.io/docs/gettingstarted#run-test)
- [action](https://webdriver.io/docs/api/browser/action/)
- [Intercept Service](https://webdriver.io/docs/wdio-intercept-service/)
- [supertest](https://www.npmjs.com/package/supertest)

# Tips:

- WEB and API tests to send password reset link to user's email and API tests to verify a password reset token and reset a user's password must be tested manually as they rely on e-mail verification.
- Double clicking the index.html file to see allure-report will not work. The command ```npx allure open reports/allure-report``` should be executed in order to open the allure-report correctly. 
