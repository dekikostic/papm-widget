## Description

/widget/PaPmRunFunction - Custom widget definition file that should be uploaded to SAC(already done on master-integration)

/widget/main.js - widged methods

/widget/builder.js - builder panel of the widget

/widget/analyticApplication.js - sample code that should be added to Analityc Application for runing a widget method. It should be triggerd on some event, for example onClick event of a button. run() is a widget method and it executes runAsync() and shows messages once run is finished. Widget does not support Object Array as output parameter, therefore, string Array is used with element in format MSGTY###MSG_TEXT and needs to be splited.

## Installation

.env file needs to be coppied to project root directory

PORT=3500 - widget expects that server is running on port 3500. in case port is changed, /widget/main.js needs to be adjusted as well

```bash
$ npm install
```

## Running the app

```bash
$ npm start
```
