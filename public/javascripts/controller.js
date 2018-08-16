var app = angular.module('app', [])
	.controller('appController', ['$scope', '$window', 'graphSvc', '$interval', function($scope, $window, graphSvc, $interval){
		console.log("init appController");

		$scope.nodeOrEdgeDetail = {
			id: 0,
			isNode: false,	// reason why we need isNode and isEdge because of multiple selections
			isEdge: false,	// because it is possible to enable multiple nodes and edges selection on the graph in UI
			data: {}
		}

	 	var focusToNodeByTel = null;
		var network, nodes, edges, options;
		var container = document.getElementById('graphRender');

		$scope.CallLogArr 	= callLogSampleData;
		$scope.ChatsArr 	= chatsSampleData;
		$scope.ContactsArr 	= contactsSampleData;


		/************************************/
		/*** Button/Click Handlers for UI ***/
		/************************************/
		$scope.ChangePhysicsState = function()
		{
			if (network == null)
				return;
			options.physics.enabled = !options.physics.enabled;
			network.setOptions(options);
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

		$scope.SearchGraphByTelephoneNumber = function(telephoneNo)
		{
			if (telephoneNo == null || telephoneNo == undefined) {
				DisplayMsgInUI("Please enter telephone number to begin search.", "info", true);
				return;
			}
			nodes.clear();
			edges.clear();
			nodes = new vis.DataSet();
			edges = new vis.DataSet();

			DisplayGraphProgressInUI('RETRIEVE_UI', true);

			graphSvc.GetNodeWithTelephoneAndItsNeighbours(telephoneNo, 2)
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
						DisplayMsgInUI("No graph found for tel='"+$scope.telephoneToFind+"'", "info", true);
						return;
					} 

					for(var i=0; i<res.data.length; i++){
						var data = res.data[i];
						var n1 = data.node1;
						var n2 = data.node2;
						var link = data.link;

						var newNode = graphSvc.CreateNode(n1);
						var newNode2 = graphSvc.CreateNode(n2);
						// remove the x y coords
						newNode.x = null;
						newNode.y = null;
						newNode2.x = null;
						newNode2.y = null;
						if (nodes.get(newNode.id) == null)
							nodes.add(newNode);
						if (nodes.get(newNode2.id) == null)
							nodes.add(newNode2);

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
					network = new vis.Network(container, data, options);
        			network.stabilize(stabilizeCount);	// ** causes the nodes to be well spread-out and in stablised state when loaded!
        									// ** We will also be unable to focus to the node if we use 'stablize()'
        			// network.stabilize();
        			focusToNodeByTel = telephoneNo;
					SetNetworkEventHandlers();
    			});
		}

		$scope.TriggerViewFullGraph = function()
		{
			DisplayGraphProgressInUI('RETRIEVE_UI', true);
			$interval(function(){
				console.log("Wait completed");
				$scope.ViewFullGraph();
			}, 500, 1);
		}

		$scope.ViewFullGraph = function()
		{
			nodes.clear();
			edges.clear();
			nodes = new vis.DataSet();
			edges = new vis.DataSet();

			graphSvc.GetAllNodes()
				.then(function(res){
					console.log("Result retrieved from server");
					DisplayGraphProgressInUI('RETRIEVE_UI', false);

					// console.log(res);
					if (res.data == null || (!Array.isArray(res.data))) {
						// error returned from server
						console.log("Error returned from server");
						DisplayMsgInUI(res,data.msg, "danger", true);
						return;
					}
					if (res.data == null || (Array.isArray(res.data) && res.data.length == 0)){
						console.log("Server returns empty graph");
						DisplayMsgInUI("No graph found in database", "info", true);
						return;
					}
					console.log("Adding nodes..");
					console.log("data.length="+res.data.length);
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
						edges.add(graphSvc.CreateEdge(link));
					}
					console.log("nodes and edges added");

					var data = {
					    nodes: nodes,
					    edges: edges
				  	};

					DisplayGraphProgressInUI('LOADING_UI', true);

			  		// adjust the stablization's iteration if node doesnt' contain x and y coordinates
			  		if (nodes != null && nodes.get().length != 0) {{
			  			if (nodes.get()[0].x != null) {
			  				options.physics.stabilization.iterations = 1;
			  				console.log("Setting options's stabilization.iterations=1");
			  			}
			  			else {
			  				options.physics.stabilization.iterations = 900;
			  				console.log("Setting options's stabilization.iterations=900");
			  			}
			  		}}

			  		console.log("Creating graph..");

					network = new vis.Network(container, data, options);
					SetNetworkEventHandlers();

					network.fit(); // zoom to fit
					network.stopSimulation();
        			network.stabilize();	// ** causes the nodes to be well spread-out and in stablised state when loaded!
				},
				function(err){
					DisplayGraphProgressInUI('RETRIEVE_UI', false);
					DisplayGraphProgressInUI('LOADING_UI', false);
					DisplayMsgInUI("Error retrieving graph from server. Please contact IT.", "danger", true);
					console.log("Error");
					console.log(err);
				});
		}

		$scope.ViewDetailedInfo = function()
		{
			// call server for detailed info
			// * To be implemented...

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

		/***********************/
		/*** Helper functions **/
		/***********************/
		$scope.FocusViewToNodeById = function(nodeId)
		{
			console.log("Requesting to focus on node with id="+nodeId);

			if (nodeId === undefined || nodeId == null) {
				// show not found message to user
				/*** To be implemented **/
				return;
			}
			console.log("Found node with id="+nodeId);
			var focusOptions = {
				scale: 1,	// higher the scale value the closer we get to the node,
				// animation: true
			}
			network.focus(nodeId, focusOptions);
			// network.selectNodes([nodeId]);	// highlights the node and it's edges
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
			var items = nodes.get();
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
				scale: 1,	// higher the scale value the closer we get to the node,
				// animation: true
			}
			network.focus(nodeId, focusOptions);
			network.selectNodes([nodeId]);	// highlights the node and it's edges
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
			// console.log("readjusting table '"+idOfTable+"'");
			datatable.columns.adjust().draw();	// *need to manually call column width adjustment for proper sizing of column width to the content 
		}

		function SetNetworkEventHandlers()
		{
			network.on("stabilizationProgress", function(params) {
                var widthFactor = params.iterations/params.total;
                // console.log("widthFactor="+widthFactor);
                var width = widthFactor * 100;

                // document.getElementById('graphRenderProgBar').style.width = width + '%';
                $scope.$broadcast('LoadingProgressChanged', {percent: width});
            });
			network.once("stabilizationIterationsDone", function() {
                console.log("Stablisation done");
                $scope.$apply(function(){
					DisplayGraphProgressInUI('LOADING_UI', false);

					if (focusToNodeByTel == null){
						if (nodes.get().length != 0){
							var nodeIdToFocus = nodes.get()[0].id;
	        				console.log("focusing to node with id="+nodeIdToFocus);
							$scope.FocusViewToNodeById(nodeIdToFocus);
	        			}	
					}
					else {
						$scope.FocusViewToNode(focusToNodeByTel);
						// network.fit();
						focusToNodeByTel = null;
					}
                })
            });

			network.on("doubleClick", function (params) {
				console.log("Double click triggered");
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
						$scope.nodeOrEdgeDetail.isNode = true;
						$scope.nodeOrEdgeDetail.isEdge = false;
						// console.log("Node detail=");
						// console.log(nodes.get(nodeId));
						// console.log(nodes.get(nodeId).data);
						$scope.nodeOrEdgeDetail.id = nodeId;
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
		    });
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

		/*********************/
		/** Debug functions **/
		/*********************/
		// This is a function for us to retrieve the positions and print them on the console
		// $scope.EnquirePos = function()
		// {
		// 	network.storePositions();
		// 	console.log("Node 0 position=");
		// 	console.log(nodes.get(0));
		// 	var arr = network.getPositions();
		// 	console.log(arr);
		// }

		
		init();

		function init()
		{
			console.log("In init()");
			nodes = new vis.DataSet();
			edges = new vis.DataSet();
			options = graphSvc.GetDefaultGraphOption();

			$scope.TriggerViewFullGraph();
		}

}]);