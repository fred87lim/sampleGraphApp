var app = angular.module('inspectGraphApp', [], function($locationProvider)
{
	$locationProvider.html5Mode(true);
});
	app.controller('inspectGraphCtrl', ['$scope', '$location','$window', 'graphSvc',  
		function($scope, $location, $window, graphSvc){

		var network, nodes, edges, options;
		var originalCopyOfNodes;

		$scope.nodeOrEdgeDetail = {
			id: 0,
			isNode: false,	// reason why we need isNode and isEdge because of multiple selections
			isEdge: false,	// it is possible to enable multiple nodes and edges selection on the graph in UI
			data: {}
		}
		$scope.telephoneToFind;
		$scope.gravitConst = 50;

		$scope.CallLogArr 	= callLogSampleData;
		$scope.ChatsArr 	= chatsSampleData;
		$scope.ContactsArr 	= contactsSampleData;


		init();

		function init()
		{
			console.log("In init()");
			// get the node id to inspect (if given in the url)
			console.log($location);	
			var nodeIdToInspect = $location.search().nodeId;

			// update UI
			$scope.telephoneToFind = $location.search().tel;

			if (nodeIdToInspect == null || nodeIdToInspect === undefined || 
				$scope.telephoneToFind == null || $scope.telephoneToFind === undefined) {
				// display message to user to search telephone number to perform inspection
				console.log("No nodeId or telephone found");
				DisplayMsgInUI("Error - nodeId not provided for inspection", "danger", true);
				return;
			}

			console.log("nodeIdToInspect="+nodeIdToInspect);
			console.log("telephoneToFind="+$scope.telephoneToFind);
			
			var container = document.getElementById('graphRender');
			nodes = new vis.DataSet();
			edges = new vis.DataSet();
			options = graphSvc.GetDefaultGraphOptionForSmallGraph();

			// We actually only need the nodeId to search the graph.
			graphSvc.GetNodeAndItsNeighbours(nodeIdToInspect, 2)
				.then(function(res){
					console.log("res=");
					console.log(res);

					DisplayGraphProgressInUI('RETRIEVE_UI', false);

					if (res.data == null){
						DisplayMsgInUI("Error - data returned is null. Please inform IT for assistance.", "danger", true);
						return;
					}

					if (res.data != null && !Array.isArray(res.data) && res.data.msg != null){
						DisplayMsgInUI(res.data.msg, "danger", true);
						return;
					}
					if (res.data != null && Array.isArray(res.data) && res.data.length == 0){
						DisplayMsgInUI("No graph found for nodeId="+nodeIdToInspect, "info", true);
						return;
					} 

					for(var i=0; i<res.data.length; i++){
						var data = res.data[i];
						var n1 = data.node1;
						var n2 = data.node2;
						var link = data.link;

						if (nodes.get(n1.id) == null)
							nodes.add(graphSvc.CreateNode(n1));
						if (nodes.get(n2.id) == null)
							nodes.add(graphSvc.CreateNode(n2));

						// create link from n1 to n2
						for(var j=0; j<link.length; j++) {
							
							if (edges.get(link[j].id) == null)
								edges.add(graphSvc.CreateEdge(link[j]));
						}
					}

					var data = {
					    nodes: nodes,
					    edges: edges
				  	};

				  	originalCopyOfNodes = nodes;

				  	console.log("Nodes size="+nodes.get().length);
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

					DisplayGraphProgressInUI('LOADING_UI', true);
					console.log("creating network object..");
					network = new vis.Network(container, data, options);
					console.log("Network object created");
					// network.fit(); // zoom to fit
					// network.stopSimulation();
        			network.stabilize(stabilizeCount);	// ** causes the nodes to be well spread-out and in stablised state when loaded!
        									// ** We will also be unable to focus to the node if we use 'stablize()'
        			// network.stabilize();
					SetNetworkEventHandlers();

    			});
		}

		function SetNetworkEventHandlers()
		{
			network.on("stabilizationProgress", function(params) {
                var widthFactor = params.iterations/params.total;
                var width = widthFactor * 100;
                // console.log("Stabilization ="+width+"%");
                $scope.$broadcast('LoadingProgressChanged', {percent: width});
            });

			network.once("stabilizationIterationsDone", function() {
                // console.log("Stablisation done");
                $scope.$apply(function(){
					DisplayGraphProgressInUI('LOADING_UI', false);

					$scope.FocusViewToNode($scope.telephoneToFind);
                })
				network.stopSimulation();	// stops the nodes from moving due to physics enabled after graph is rendered 
											// with the stabilization iterations completed.
            });

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

						// for testing UI purpose
						if ($scope.nodeOrEdgeDetail.data.name== null)
							$scope.nodeOrEdgeDetail.data.name = "Tan Kok Heng";
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
		    });
		}


		$scope.gravitConstChange = function()
		{
			if (network != null) {
				console.log("gravitConst="+$scope.gravitConst);
				// value should be between -2000 to -40000
				options.physics.enabled = true;
				options.physics.barnesHut.gravitationalConstant = -(2000 + $scope.gravitConst/100 * 48000);
				network.setOptions(options);
			}
		}	


		var togglePosFlag = false;
		$scope.ChangeGraphPositions = function()
		{

			console.log("ChangeGraphPositions");
			togglePosFlag = !togglePosFlag;
			if (togglePosFlag) {
				// let the graph shrink
				options.physics.enabled = true;
				options.physics.barnesHut.springLength = 100;
				options.physics.stabilization.iterations = 200;
				network.setOptions(options);
				// network.stopSimulation();
				// network.stabilize();
			}
			else {
				options.physics.enabled = false;
				options.physics.barnesHut.springLength = 250;
				options.physics.stabilization.iterations = 1;
				network.setOptions(options);
				// set the nodes and edges again so that the graph rendered
				// will use the node's x and y coordinates to draw the node's position
				network.setData({nodes: nodes, edges: edges});
				network.redraw();
				network.stopSimulation();
				network.stabilize();
			}
		}

		$scope.FocusViewToNode = function(telephoneNum)
		{
			if (nodes == null || nodes.get() == null || nodes.get().length == 0) 
				return;
			
			console.log("Requesting to focus on telephone num="+telephoneNum);
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
			if(network == null)
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
			console.log("From "+options.physics.enabled);
			options.physics.enabled = !options.physics.enabled;
			network.setOptions(options);
			// network.options.physics.enabled = !network.options.physics.enabled;
		}
	
		
		$scope.ViewDetailedInfo = function()
		{
			// call server for detailed info
			// * To be implemented...

			// show modal
			$('#modalViewDetailedInfo').modal('show');

			InitDatatable('#callLogTable');
			InitDatatable('#chatsTable');
			InitDatatable('#contactsTable');
			InitDatatable('#emailsTable');
			InitDatatable('#mmsMsgTable');
			InitDatatable('#smsMsgTable');
		}

		function InitDatatable(idOfTable){
			 var datatable;
			
			// check if datatable has been init before
			if ( ! $.fn.DataTable.isDataTable(idOfTable) ) {
				console.log("Table '"+idOfTable+"' NOT init before");
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
				console.log("Table '"+idOfTable+"' init before");
				datatable = $(idOfTable).DataTable();
			}

			// console.log("readjusting table '"+idOfTable+"'");
			// datatable.columns.adjust().draw();
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