var app = angular.module('findNodeConnApp', [], function($locationProvider)
{
	$locationProvider.html5Mode(true);
})
	.controller('findNodeConnCtrl', ['$scope', '$location','$window', 'graphSvc', function($scope, $location, $window, graphSvc){

		var network, nodes, edges, options;
		var container = document.getElementById('graphRender');

		$scope.nodeOrEdgeDetail = {
			id: 0,
			isNode: false,	// reason why we need isNode and isEdge because of multiple selections
			isEdge: false,	// it is possible to enable multiple nodes and edges selection on the graph in UI
			data: {}
		}
		$scope.telephoneToFind;

		$scope.CallLogArr = callLogSampleData;
		$scope.ChatsArr = chatsSampleData;
		$scope.ContactsArr = contactsSampleData;

		
		init();

		function init()
		{
			console.log("In init()");
			nodes = new vis.DataSet();
			edges = new vis.DataSet();
			options = graphSvc.GetDefaultGraphOptionForSmallGraph();
			console.log("End of init()");
		}

		function SetNetworkEventHandlers()
		{
			network.on("doubleClick", function (params) {
				if (params.nodes.length==1) {
					$('#modalInspectNode').modal('show');
				}
		        // params.event = "[original event]";
		        // document.getElementById('eventSpan').innerHTML = '<h2>doubleClick event:</h2>' + JSON.stringify(params, null, 4);
		    });
			network.on("click", function (params) {

				// determine if node or edge is selected
				if (params.nodes.length==1) {
					// get the node data
					var nodeId = params.nodes[0];
					$scope.$apply(function(){
						$scope.nodeOrEdgeDetail.id = nodeId;
						$scope.nodeOrEdgeDetail.isNode = true;
						$scope.nodeOrEdgeDetail.isEdge = false;
						console.log("Node detail=");
						console.log(nodes.get(nodeId).data);
						$scope.nodeOrEdgeDetail.data = nodes.get(nodeId).data;

					});
				}
				else if (params.edges.length == 1){
					// get the edge data
					var edgeId = params.edges[0];
					$scope.$apply(function(){
						$scope.nodeOrEdgeDetail.isNode = false;
						$scope.nodeOrEdgeDetail.isEdge = true;
						$scope.nodeOrEdgeDetail.data = edges.get(edgeId).data;

					});
				} else {
					$scope.$apply(function(){
						$scope.nodeOrEdgeDetail.isNode = false;
						$scope.nodeOrEdgeDetail.isEdge = false;
						$scope.nodeOrEdgeDetail.data = {};
					});
				}

				// console.log("params=");
				// console.log(params);

		  //       params.event = "[original event]";
		  //       var es = angular.element( document.querySelector( '#eventSpan' ) );
		  //       console.log("Es=");
		  //       console.log(es);
		  //       es.innerHTML = '<h2>Click event:</h2>' + JSON.stringify(params, null, 4);
		  //       console.log(params);

		  //       $scope.$apply(function(){	
		  //       	// wrap inside $scope.$apply() so that view will be updated
		  //       	$scope.dom.x = params.pointer.DOM.x;
		  //       	$scope.dom.y = params.pointer.DOM.y;
		  //       	$scope.canvas.x = params.pointer.canvas.x;
		  //       	$scope.canvas.y = params.pointer.canvas.y;
		  //       });
		  //       console.log("$scope.dom.x="+$scope.dom.x);

		        // document.getElementById('eventSpan').innerHTML = '<h2>Click event:</h2>' + JSON.stringify(params, null, 4);
		        // console.log('click event, getNodeAt returns: ' + this.getNodeAt(params.pointer.DOM));
		    });
		}

		$scope.FindConnectionBetweenTwoNodes = function(telephone1, telephone2)
		{
			if (telephone1 == undefined || telephone1 == null){
				DisplayMsgInUI("Please enter tel. 1", "info", true);
				return;
			}
			if (!$.isNumeric(telephone1)){
				DisplayMsgInUI("Please provide a valid tel. 1", "info", true);
				return;
			}

			if (telephone2 == undefined || telephone2 == null){
				DisplayMsgInUI("Please enter tel. 2", "info", true);
				return;
			}
			if (!$.isNumeric(telephone2)){
				DisplayMsgInUI("Please provide a valid tel. 2", "info", true);
				return;
			}

			nodes.clear();
			edges.clear();
			graphSvc.findLinkBetweenTwoNodes(telephone1, telephone2)
				.then(function(res){
					console.log("res=");
					console.log(res);

					if (res.data != null && !Array.isArray(res.data) && res.data.msg != null) {
						DisplayMsgInUI(res.data.msg, "danger", true);
						return;
					}
					if (res.data == null || res.data.length == 0) {
						DisplayMsgInUI("There are no connection found for the two numbers provided", "info", true);
						return;
					}

					var nodeArr = res.data.nodes;
					var edgeArr = res.data.edges;

					for(var i=0;i<nodeArr.length; i++)
						nodes.add(graphSvc.CreateNode(nodeArr[i]));
					for(var i=0;i<edgeArr.length; i++)
						edges.add(graphSvc.CreateEdge(edgeArr[i]));

					var data = {
					    nodes: nodes,
					    edges: edges
				  	};

				  	var size = nodes.get().length;
				  	var stabilizeCount = 300;

				  	options.layout.improvedLayout = true;
				  	if (size > 500 && size < 1000){
				  		stabilizeCount = 500;
				  	}
				  	else if (size >= 1000){
				  		options.layout.improvedLayout = false;
				  		stabilizeCount = 800;
				  	}

					network = new vis.Network(container, data, options);
        			network.stabilize(stabilizeCount);	// ** causes the nodes to be well spread-out and in stablised state when loaded!
        									// ** We will also be unable to focus to the node if we use 'stablize()'

					SetNetworkEventHandlers();

				}, function(err){
					console.log("Error");
					console.log(err);
					DisplayMsgInUI("Error retrieving graph from server. Please contact IT.", "danger", true);
				});
		}

		$scope.FocusViewToNode = function(telephoneNum)
		{
			// handle case where there are no graph rendered
			if (nodes == null || nodes.get() == null || nodes.get().length == 0) 
				return;

			if (telephoneNum == null || telephoneNum == undefined || telephoneNum == '') {
				DisplayMsgInUI("Please enter telephone number to focus to", "info", true);
				return;
			}

			var nodeId;
			var items = nodes.get();	// *use 'get()' to retrieve all the items in the DataSet as an array
			for(var i=0; i<items.length; i++){
				var n = items[i];
				if (n.data.contact_no == telephoneNum) {
					nodeId = n.id;
					break;
				}
			}
				
			// });
			if (nodeId === undefined || nodeId == null) {
				DisplayMsgInUI("Tel '"+telephoneNum+"' is not found in the current graph", "info", true);
				return;
			}
			console.log("Found node with id="+nodeId);
			var focusOptions = {
				scale: 1,	// higher the scale value the closer we get to the node
			}
			network.focus(nodeId, focusOptions);
			network.selectNodes([nodeId]);	// highlights the node and it's edges
		}

		$scope.FitGraphToView = function()
		{
			if (network == null)
				return;

			network.fit();
		}

		$scope.InspectNode = function()
		{
			$window.open('/inspectGraph?nodeId='+$scope.nodeOrEdgeDetail.id+
				'&tel='+$scope.nodeOrEdgeDetail.data.contact_no, '_blank');
			$('#modalInspectNode').modal('hide');
		}

		$scope.ChangePhysicsState = function()
		{
			if (network == null)
				return;

			console.log("Changing physics state");
			options.physics.enabled = !options.physics.enabled;
			network.setOptions(options);
			// network.options.physics.enabled = !network.options.physics.enabled;
		}

		$scope.ViewDetailedInfo = function()
		{
			// call server for detailed info
			// * To be implemented...
			// var callLogDatatable;
			// // check if datatable has been init before
			// if ( ! $.fn.DataTable.isDataTable( '#callLogTable' ) ) {
			// 	// init the datatable with custom config
			// 	callLogDatatable = $('#callLogTable').DataTable({
			// 		// "lengthChange": false,
			// 		"scrollY" : "300px",
			// 		"scrollX": true,
			// 		"paging": false,
			// 		// "lengthMenu": [10]	
			// 	});
			// }
			// else {
			// 	callLogDatatable = $('#callLogTable').DataTable();
			// }

			// show modal
			$('#modalViewDetailedInfo').modal('show');
			// initialisation of the datatable to be done after showing modal for the datatable's column adjustment to be done properly.
			// InitCallLogDatatable();
			InitDatatable('#callLogTable');
			InitDatatable('#chatsTable');
			InitDatatable('#contactsTable');
			InitDatatable('#emailsTable');
			InitDatatable('#mmsMsgTable');
			InitDatatable('#smsMsgTable');
			// callLogDatatable.columns.adjust().draw();	// *need to manually call column width adjustment for proper sizing of column width to the content 
		}

		$scope.InitDataTable = function(idOfTable)
		{
			// console.log("Init table '"+idOfTable+"'");
			InitDatatable(idOfTable);
		}


		function InitDatatable(idOfTable){
			 var datatable;
			 
			// check if datatable has been init before
			if ( ! $.fn.DataTable.isDataTable(idOfTable) ) {
				// init the datatable with custom config
				datatable = $(idOfTable).DataTable({
					// "lengthChange": false,
					"scrollY" : "300px",
					"scrollX": true,
					"paging": false,
					// "lengthMenu": [10]	
				});
				// }).columns.adjust().draw();
			}
			else {
				datatable = $(idOfTable).DataTable();
			}
			datatable.columns.adjust().draw();	// *need to manually call column width adjustment for proper sizing of column width to the content 
		}

		// Inform notification controller to display progress in UI
		function DisplayGraphProgressInUI(type, showFlag)
		{
			if (type == 'RETRIEVE_UI') {
				$scope.$broadcast('displayGraphRetrieveUI', {showFlag: showFlag});
			}
			else if (type == 'LOADING_UI'){
				$scope.$broadcast('displayGraphLoadUI', {showFlag: showFlag});
			}
			else {

			}
		}

		// Inform notification controller to display message in UI
		function DisplayMsgInUI(msg, type, showFlag)
		{
			$scope.$broadcast('displayMsg', {msg: msg, type: type, showFlag: showFlag})
		}
	}]);