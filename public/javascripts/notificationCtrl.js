
app.controller('notifCtrl', ['$scope', '$window', 'graphSvc', '$interval', function($scope, $window, graphSvc, $interval){

	init();
	function init()
	{
		console.log("In notifCtrl, init()");
	}

	var alertInfoTimeout;
	var alertDangerTimeout;

	$scope.uiNotif = {
		graph : {
			retrieving: false,
			loading: false
		},
		msg : {
			warning: null,
			danger: null
		}
	}

	$scope.$on('displayGraphRetrieveUI', function(event, args){
		$scope.uiNotif.graph.retrieving = args.showFlag;
	});
	$scope.$on('displayGraphLoadUI', function(event, args){
		$scope.uiNotif.graph.loading = args.showFlag;
	});

	$scope.$on('displayMsg', function(event, args){
		ManageAlertMsg(args.msg, args.type, args.showFlag);
	});

	$scope.$on("LoadingProgressChanged", function(event, args){
		document.getElementById('graphRenderProgBar').style.width = args.percent + '%';
	});

	$scope.ManualCloseAlertInfoMsg = function(msgType)
	{
		ManageAlertMsg("", msgType, false);
	}

	function ManageAlertMsg(msgToShow, typeOfMsg, showFlag)
		{
			if (typeOfMsg == "info")
			{
				if (showFlag)
				{
					$scope.uiNotif.msg.warning = msgToShow;
					$(".alert-info")
						.slideDown(200, function(){
							alertInfoTimeout = $window.setTimeout(function(){
								$(".alert-info").slideUp(300, function(){
									// $(this).remove();
								});
							}, 2000);
						})
						.fadeTo(200,1);
				}
				else {
					clearTimeout(alertInfoTimeout);
					$(".alert-info").slideUp(200, function(){});
				}
			}
			else if (typeOfMsg == "danger"){
				if (showFlag)
				{
					$scope.uiNotif.msg.danger = msgToShow;
					$(".alert-danger")
						.slideDown(200, function(){
							alertDangerTimeout = $window.setTimeout(function(){
								$(".alert-danger").slideUp(300, function(){
									// $(this).remove();
								});
							}, 4000);
						})
						.fadeTo(200,1);
				} else {
					clearTimeout(alertDangerTimeout);
					$(".alert-danger").slideUp(200, function(){});

				}
			} else {
				console.log("Unable to determine alert msg type '"+typeOfMsg+"'");
			}
		}
}]);