var express = require('express');
var router = express.Router();

const neo4j = require('neo4j-driver').v1;
const uri = 'bolt://127.0.0.1:7687';
// const driver = neo4j.driver(uri, neo4j.auth.basic('admin', 'wpvpj4dg'));
const driver = neo4j.driver(uri, neo4j.auth.basic('neo4j', 'wpvpj4dg'));

/// This function will package the node data into the json format 
/// that will be passed to the frontend. We need to liaise with frontned
/// on the format that we will pass to them.
function RepackageCypherNodeData(d)
{
	console.log("IN RepackageCypherNodeData, d=");
	console.log(d);
	var data = {
		type: d.labels[0],
		id: d.identity.low,
		x: d.properties.x != undefined ? d.properties.x.low : null,
		y: d.properties.y != undefined ? d.properties.y.low : null,
		info: {},
	}

	var label = d.labels[0];
	if ((label== 'CTX' || label=='Telephone') && d.properties.number != null){
		var num = d.properties.number.low;
		// data.label = num;
		// add the info of telephone here
		data.info.contact_no = num;
		data.info.country = 'SG';
		data.info.country_code = '65';
		data.info.name = d.properties.name;
		// data.info.age = d.properties.age.low;
		
	} else if (label == 'POI' && d.properties.name != null){
		// data.label = d.properties.name;
		data.info.name = d.properties.name;
		// data.info.sex = d.properties.sex;
		// data.info.dob = d.properties.dob;
		// data.info.nationality = d.properties.nationality;
	}

	return data;
}

function RepackageCypherRelationshipData(d)
{
	// console.log("\n");
	// console.log("IN RepackageCypherRelationshipData, d=");
	// console.log(d);
	// console.log(d.identity);
	var data = {
		type	: d.type,
		labels 	: d.type,
		id 		: d.identity.low,
		start 	: d.start.low,
		end 	: d.end.low,
		info 	: {},
	};
	// console.log("Okay");
	// console.log("");
	return data;
}

// Used by queries that specifically gets nDegree relationships of a node
// where such queries returns multiple edges/links/relationship info in an array
function RepackageMultiCypherRelationshipData(linkArr)
{
	var data = [];
	for(var i=0; i<linkArr.length; i++)
		data.push(RepackageCypherRelationshipData(linkArr[i]));
	return data;
}

router.get('/v2', function(req, res, next) {
	console.log("In graphApi v2");

	const session = driver.session();
	console.time("runCypher");
	const resultPromise = session.run(
	  // 'MATCH (n:CTX)-[k:`'']->(m:Telephone) RETURN n,k,m'
	  "MATCH (n)-[r]->(m) RETURN n,r,m;"
	);
	console.timeEnd("runCypher");
	console.time("queryPromise");

	console.log("calling promise");
	resultPromise.then(result => {
			console.timeEnd("queryPromise");
			var data = [];
			session.close();
			// console.log(result);
			if (result.records != null && result.records.length != 0){
				// console.log("Records count="+result.records.length);
				const singleRecord = result.records[0];
				console.log(singleRecord);
				const node = singleRecord.get(0);

				console.log("retrieved one node with data=");
				console.log(node);
				// console.log(node.properties.name);
				// console.log(result.records[0].get(0));
				// console.log(result.records[0].get(1));
				// console.log(result.records[0].get(2));

				// result got using 'record[i].get(0)' is such that the
				// data returned to frontend will be nicely packaged
				for(var i=0; i<result.records.length; i++) {
					// package the data to our own format
					var d = {
						node1: RepackageCypherNodeData(result.records[i].get(0)),
						link: RepackageCypherRelationshipData(result.records[i].get(1)),
						node2: RepackageCypherNodeData(result.records[i].get(2))
					}
					data.push(d);
				}
			}

			// on application exit:
			driver.close();
			res.send(data);
	}).catch(error => {
		session.close();
		driver.close();
		console.log("*********************");
		console.log("*********************");
		console.log("Error - ");
		console.log(error);
		console.log("Printing object keys..");
		console.log(Object.keys(error));
		console.log("Printing name..");
		console.log(error.name);
		console.log("Printing error code..")
		console.log(error.code);
		console.log("End of error log");
		console.log("*********************");
		console.log("*********************");

		if (error.code != null && error.code == "ServiceUnavailable") {
			res.send({success: false, msg: 'Error. Unable to connect to database. Please ensure database is running.'});
		}
		else {
			res.send({success:false, msg: 'Error. Please contact IT for assistance.'});
		}
	});
});



/* GET home page. */
router.get('/', function(req, res, next) {
	console.log("In graphApi");

	const session = driver.session();
	// const resultPromise = session.run(
	//   'MATCH (n) RETURN n LIMIT 25'
	// );
	const resultPromise = session.run(
	  'MATCH (n:Telephone)-[k:Called]->(m:Telephone) RETURN n,k,m'
	);

	console.log("calling promise");
	resultPromise.then(result => {
			var data = [];
			session.close();
			console.log(result);
			if (result.records != null && result.records.length != 0){
				// console.log("Records count="+result.records.length);
				// const singleRecord = result.records[0];
				// console.log(singleRecord);
				// const node = singleRecord.get(0);

				// console.log("retrieved one node with data=");
				// console.log(node);
				// console.log(node.properties.name);
				// console.log(result.records[0].get(0));
				// console.log(result.records[0].get(1));
				// console.log(result.records[0].get(2));

				// result got using 'record[i].get(0)' is such that the
				// data returned to frontend will be nicely packaged
				for(var i=0; i<result.records.length; i++) {
					// package the data to our own format
					var d = {
						node1: result.records[i].get(0),
						link: result.records[i].get(1),
						node2: result.records[i].get(2)
					}
					data.push(d);
					// data.push(result.records[i].get(0));
				}

			}

			// on application exit:
			driver.close();

			// res.send('managed to use neo4j driver');
			// res.send(result.records);
			res.send(data);
	}).catch(error => {
		session.close();
		driver.close();
		console.log("Error - ");
		console.log(error);
		console.log("end of error");

		if (error.Neo4jError != null && error.Neo4jError.contains('connect ECONNREFUSED')) {
			res.send({success: false, msg: 'Unable to connect to database'});
		}
		else {
			res.send({success:false, msg: 'Error. Please contact IT for assistance.'});
		}
	});

  // res.send('respond with a resource');
});

// Gets a graph with a node and its surrounding neighbours
// req should include the field 'nodeId' and 'nDegree' to indicate
// the number of degree of neighbours to get
router.get('/GetGraphWithNode', function(req, res, next){
	console.log("In GetGraphWithNode()");
	// console.log("req.params=");
	// console.log(req.params);
	console.log("req.query=");
	console.log(req.query);
	var nodeId = req.query.nodeId;
	var nDegree = req.query.nDegree;

	const session = driver.session();

	const resultPromise = session.run(
		// 'MATCH ID()-[r*1..2]-(m) WHERE n <> m return n, r, m'
		// 'MATCH p = (n{number:94513433}) -[*1..4]-(m) with *, relationships(p) as u return n, u, m'

		'MATCH P = (S)-[*1..'+nDegree+']-(M) WHERE ID(S) ='+nodeId+' and ID(S)<>ID(M) with *, RELATIONSHIPS(P) as R RETURN S,R,M'

	  	// "MATCH p=(n)-[r:`'in contact with'`*1.."+nDegree+"]-(m) WHERE ID(n)="+nodeId+"  RETURN nodes(p), r"
	);

	console.log("calling promise");
	resultPromise.then(result => {
			var data = [];
			session.close();
			if (result.records != null && result.records.length != 0){

				console.log("Result.records.length="+result.records.length);

				console.log(result.records[0].get(0));
				console.log(result.records[0].get(1));
				// console.log(result.records[0].get(2));	

				// result got using 'record[i].get(0)' is such that the
				// data returned to frontend will be nicely packaged
				for(var i=0; i<result.records.length; i++) {
					// package the data to our own format
					var d = {
						node1: RepackageCypherNodeData(result.records[i].get(0)),
						link: RepackageMultiCypherRelationshipData(result.records[i].get(1)),
						node2: RepackageCypherNodeData(result.records[i].get(2))
					}
					data.push(d);
				}

			}

			// on application exit:
			driver.close();
			res.send(data);
	}).catch(error => {
		session.close();
		driver.close();
		console.log("Error - ");
		console.log(error);
		console.log("end of error");

		if (error.code != null && error.code == "ServiceUnavailable") {
			res.send({success: false, msg: 'Error. Unable to connect to database. Please ensure database is running.'});
		}
		else {
			res.send({success:false, msg: 'Error. Please contact IT for assistance.'});
		}
	});

	// return res.send({success:true, data: {}});
});

router.get('/GetGraphWithNodeByTelephone', function(req, res, next){
	console.log("In GetGraphWithNode()");
	// console.log("req.params=");
	// console.log(req.params);
	console.log("req.query=");
	console.log(req.query);
	var telephone = req.query.telephone;
	var nDegree = req.query.nDegree;

	const session = driver.session();

	const resultPromise = session.run(
		// 'MATCH ID()-[r*1..2]-(m) WHERE n <> m return n, r, m'
		// 'MATCH p = (n{number:94513433}) -[*1..4]-(m) with *, relationships(p) as u return n, u, m'

		'MATCH P = (S)-[*1..'+nDegree+']-(M) WHERE S.number = '+telephone+' and S <> M with *, RELATIONSHIPS(P) as R RETURN S,R,M'

	  	// "MATCH p=(n)-[r:`'in contact with'`*1.."+nDegree+"]-(m) WHERE ID(n)="+nodeId+"  RETURN nodes(p), r"
	);

	console.log("calling promise");
	resultPromise.then(result => {
			var data = [];
			session.close();
			if (result.records != null && result.records.length != 0){

				console.log("Result.records.length="+result.records.length);

				console.log(result.records[0].get(0));
				console.log(result.records[0].get(1));
				// console.log(result.records[0].get(2));	

				// result got using 'record[i].get(0)' is such that the
				// data returned to frontend will be nicely packaged
				for(var i=0; i<result.records.length; i++) {
					// package the data to our own format
					var d = {
						node1: RepackageCypherNodeData(result.records[i].get(0)),
						link: RepackageMultiCypherRelationshipData(result.records[i].get(1)),
						node2: RepackageCypherNodeData(result.records[i].get(2))
					}
					data.push(d);
				}

			}

			// on application exit:
			driver.close();
			res.send(data);
	}).catch(error => {
		session.close();
		driver.close();
		console.log("Error - ");
		console.log(error);
		console.log("end of error");

		if (error.code != null && error.code == "ServiceUnavailable") {
			res.send({success: false, msg: 'Error. Unable to connect to database. Please ensure database is running.'});
		}
		else {
			res.send({success:false, msg: 'Error. Please contact IT for assistance.'});
		}
	});

	// return res.send({success:true, data: {}});
});

// Returns the nodes and edges that link the two nodes if exist.
router.get('/findLinkBetweenTwoNodes', function(req, res, next){
	console.log("In findLinkBetweenTwoNodes()");
	console.log("req.query=");
	console.log(req.query);
	var node1Tel = req.query.node1Tel;
	var node2Tel = req.query.node2Tel;

	const session = driver.session();
	const resultPromise = session.run(
	  // 'MATCH (n:CTX)-[k:`'']->(m:Telephone) RETURN n,k,m'
	  // "MATCH (n {number:"+node1Tel+"})-[r]->(m {number:"+node2Tel+"}) RETURN n,r,m;"
	  // "MATCH (n{number:"+node1Tel+"})-[r:`'in contact with'`*]-(m{number:"+node2Tel+"})  RETURN n,r,m"
	  // "MATCH p=(n{number:"+node1Tel+"})-[r:`'in contact with'`*]-(m{number:"+node2Tel+"})  RETURN nodes(p), r"
	  "MATCH p=(n{number:"+node1Tel+"})-[r:CONTACTED*]-(m{number:"+node2Tel+"})  RETURN nodes(p), r"
	);

	console.log("calling promise");

	console.time("findLink");
	resultPromise.then(result => {
		console.timeEnd("findLink");
		var data = [];
		session.close();
		console.log("Size="+result.records.length);
		try {
			if (result.records != null && result.records.length != 0){
				// console.log("Records count="+result.records.length);
				const singleRecord = result.records[0];
				// console.log(singleRecord);
				const node = singleRecord.get(0);

				// console.log("retrieved one node with data=");
				// console.log(node);
				// console.log(node.properties.name);
				// console.log(result.records[0].get(0));
				// console.log(result.records[0].get(1));
				// console.log(result.records[0].get(2));
				if (result.records[0] == null || result.records[0].length == 0) {
					// no result
					console.log("not result for link between the two nodes");
				}
				else {
					var nodeArr = result.records[0].get(0);
					var edgeArr = result.records[0].get(1);
					for(var i=0; i<nodeArr.length; i++)
						nodeArr[i] = RepackageCypherNodeData(nodeArr[i]);
					for(var i=0; i<edgeArr.length; i++)
						edgeArr[i] = RepackageCypherRelationshipData(edgeArr[i]);

					data = {
						nodes: nodeArr,
						edges: edgeArr
					}
				}
			}
		} catch(err) {
			console.log("/////////////////////////////////////");
			console.log("Exception in /findLinkBetweenTwoNodes");
			console.log("Exception msg:");
			console.log(err);
			console.log("End of exception msg.");
			console.log("/////////////////////////////////////");

			driver.close();
			res.send({success:false, msg:"Error. Please contact IT for assistance. 'Exception in findLinkBetweenTwoNodes()"});
		}

		// on application exit:
		driver.close();
		res.send(data);
	}).catch(error => {
		session.close();
		driver.close();
		console.log("Error - ");
		console.log(error);
		console.log("end of error");

		if (error.code != null && error.code == "ServiceUnavailable") {
			res.send({success: false, msg: 'Error. Unable to connect to database. Please ensure database is running.'});
		}
		else {
			res.send({success:false, msg: 'Error. Please contact IT for assistance.'});
		}
	});
});

// Get the node info
router.get('/GetNode', function(req, res, next){

});

// Update the node
router.get('/UpdateNode', function(req, res, next){

});

// Gets the edge info
router.get('/GetEdge', function(req, res, next){

});

// Updates an edge. 
router.get('/UpdateEdge', function(req, res, next){

});

module.exports = router;
