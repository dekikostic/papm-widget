/* eslint-disable prettier/prettier */

/*
Widget "Run Function" needst to be added first to Analytic Application, and then bellow code can be used to execute 
widget method. Widget will be located under "Custom Widget" folder. If the widget is not available, 
it needs to be uploaded( file /widget/PaPmRunFunction), check README.md

Run parameters(env, ver,fid...) should be maintained in builder panel of the widget. After values are maintained, 
return key needs to be selected, otherwise values will not be taken over.

RunFunc_1 - default widget alias, needs to be adjusted if widget is renamed in analytic application
Syntax is subset os JS ES5 syntax. let, for of, foreach... are not supported.
https://www.sapanalytics.cloud/wp-content/uploads/2020/09/DeveloperHandbookSACAnalyticsDesigner.pdf

copy code bellow this point to event handler( e.g. button onClick)
*/

var almsg = RunFunc_1.run();
var msgty = ApplicationMessageType.Info;

for (var i = 0; i < almsg.length; i++) {
  switch (almsg[i].split('###')[0]) {
    case 'A':
    case 'E':
      msgty = ApplicationMessageType.Error;
      break;
    case 'W':
      msgty = ApplicationMessageType.Warning;
      break;
    case 'I':
      msgty = ApplicationMessageType.Info;
      break;
    case "S":
			msgty = ApplicationMessageType.Success;
			break;
  }

  Application.showMessage(msgty, almsg[i].split('###').pop());
}
