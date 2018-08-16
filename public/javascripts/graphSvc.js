app.factory('graphSvc', ['$http', function($http){
	var factory = {};

	factory.GetAllNodes = function()
	{
		// return $http.get('/graphApi');
		return $http.get('/graphApi/v2');
	}

	factory.GetNodeAndItsNeighbours = function(nodeId, nDegree)
	{
		return $http.get('/graphApi/GetGraphWithNode', {params: {nodeId: nodeId, nDegree: nDegree}});
	}

	factory.GetNodeWithTelephoneAndItsNeighbours = function(telephone, nDegree)
	{
		return $http.get('/graphApi/GetGraphWithNodeByTelephone', {params: {telephone: telephone, nDegree: nDegree}});
	}

	factory.findLinkBetweenTwoNodes = function(node1Tel, node2Tel)
	{
		return $http.get('/graphApi/findLinkBetweenTwoNodes', {params: {node1Tel: node1Tel, node2Tel: node2Tel}});
	}

	factory.CreateNode = function(nodeData)
	{
		var name = "";
		var age = 35;
		if (nodeData.info.name != null)
			name = nodeData.info.name;
		if (nodeData.info.age != null)
			age = nodeData.info.age;
		
		var nodeChosenFunct = function(values, id, selected, hovering) {
							// values.borderWidth = 3;
							// values.borderColor = '#000000';
							// values.shadow = true;
							// values.shadowColor = "#ff0000";
							values.shadowSize = 20;
							// values.size = 80;
							// values.
						};

		var contactNo;
		if (nodeData.info.contact_no != null) 
			contactNo = nodeData.info.contact_no.toString();

		var n = {
			id: nodeData.id,
			label: name+"\n"+contactNo+"\nAge: "+age+"yrs",
			title: "<div>Number:"+contactNo+"</div><br>"+"<p style='font-style:italic'>*Double-click to inspect it</p>",
			// value: 10,
			shape: 'circle',
			image: 'images/person.png',
			shape: 'image',
			chosen: {
					node:  nodeChosenFunct,
				},
			color: {
				background: '#0e4091',
				border: '#b8cdef',
				highlight: {
			        border: '#e00606',
			        background: '#e00606'
		      	},
			      hover: {
			        border: '#2B7CE9',
			        background: '#D2E5FF'
		      	}
			},
			font: {
				color: '#000000',
				background: '#ffffff',
			},
			data: nodeData.info,
			x: nodeData.x,	// *set the x and y pos for fast stablization if the positions are available in database
			y: nodeData.y
		}

		return n;
	}


	factory.CreateEdge = function(link)
	{
		// console.log("Creating edge from "+nodeData1.properties.number.low+" to "+nodeData2.properties.number.low);
		return {
			id: link.id,
			from: link.start, 
			to: link.end,
			label: link.type,
			// arrows: 'to, from',
			font: {
				align: 'top'
			},
			// smooth: {
			// 	// type: 'curvedCW',
			// 	// type: 'dynamic',
			// 	// roundness: roundVal	
			// 	// enabled: false
			// },
			color: {
				color: '#5b5457',
				highlight: '#012ba8',
				opacity: 1.0,
			},
			// physics: false	// *If we disable the physics for the edge, then the graph will form a circular shape!
		}
	}

	factory.GetDefaultGraphOption = function()
	{
		return {
			physics: {
				// stabilization: false
				barnesHut: {
					gravitationalConstant: -50000,

				},
				stabilization: {
					enabled:true,
					iterations: 900,
                    updateInterval:1
				},
				enabled: true
			},
			layout: {
				improvedLayout: false,
				randomSeed: 1,
			},
			edges: {
				width: 0.15,
			// 	smooth: {
			// 		// type: 'dynamic',
			// 		enabled: false
			// 	},
				smooth: true,

			    arrows: {
			    	to: {
			    		enabled : true
			    	}
			    }
			}
		};
	}

	factory.GetDefaultGraphOptionForSmallGraph = function()
	{
		return {
			interaction:{
				hover:true,
				// hideEdgesOnDrag: true,
				// multiselect: true,
			},
			// nodes: {	
			// 	scaling: { // indicates that we want to size the nodes according to their 'value' property
			// 		label: {
			// 			min: 12, 	// set the min size
			// 			max: 18		// set the max size
			// 		}
			// 	}
			// },
			edges: {	// Note: 'edges' and 'physics' can data can be configured online at 
						// 		http://visjs.org/examples/network/physics/physicsConfiguration.html
						// 		and be generated into code to copy and paste here
				width: 0.9,
			    smooth: {
			    		// type:'continuous',		// *'continuous' type is needed if multiple edges between two nodes
			    								// needs to be shown on the graph
			    		// type:'dynamic',
			    		// type:'straightCross',
				      // forceDirection: "none",
				      // roundness: 0.35,
				      enabled: true, 	// *for better performance, disable smooth
			    },
			    // length: 2200,
			    arrows: {
			    	to: {
			    		enabled : true
			    	}
			    }
			  },
			physics: {
			    barnesHut: {
			      centralGravity: 0,
			      springLength: 250,	// don't use so that the edges do not spring back when pulled
			      							// springLength and stablization will affect how the graph will 
			      							// look when it has stablised ()
			      damping: 0.09,
			      // avoidOverlap: 0.2,		

			       gravitationalConstant: -40000, 
			      //springConstant: 0.001, springLength: 200					    
			  	},
			    // maxVelocity: 2,
			    // minVelocity: 0.75,
			    maxVelocity: 50,		// *Max and min velocity can affect the physics. 
			    					// Too high can cause physics animation to fail!
			    minVelocity: 0.75,
			    stabilization: {
			    	// fit: false,
			    	iterations: 2000,	// higher the 'iterations' value, the more spread-out the graph will be.
			    					// Higher value also affects the loading time (because it takes longer iterations to stablise)
		    						// Think of it as the number of times it will take before the graph 
		    						// stablises with the physics enabled
			    },
			    enabled: true
			    // enabled:true
			},
			// physics: false,
			layout:{
				improvedLayout: true,
				randomSeed: 3	
			}

			// manipulation: {
			// 	enabled: true
			// }
		};
	}

	return factory;
}]);