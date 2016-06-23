// Deinfe function port of hierarchy graph

$.hierarchyGraphPort = function(settingObject) {
	
	// Initial parameters for function
	$.initVariable = {
		jsonDataPath: 'json/species.json',
		lastPileLablesOn: 1,
		canvasInfos: {
			overallHeight: 400,
			overallWidth: 800,
		},
		graphLayout: {
			rootName: 'ROOT',
			radiusCornor: 10,
			fontPixSize: 4.8,
			rowSpaceDistance: 20,
			lastPileWidth: 30,
			overallXaxis: 0,
		},
		marginValues: {
			top: 0,
			right: 0,
			left: 0,
			botton: 0
		},
	};
	
	// Extend the parameters if users have been set
	$.extend($.initVariable, settingObject);
	
	$.widthSVG = $.initVariable.canvasInfos.overallWidth
				- $.initVariable.marginValues.right
				- $.initVariable.marginValues.left;
				
	$.heightSVG = $.initVariable.canvasInfos.overallHeight
				- $.initVariable.marginValues.botton
				- $.initVariable.marginValues.top;
	
	// Define infos if tree layout
	$.tree = d3.layout.tree()
				.size([$.heightSVG, $.widthSVG])
				.children(function(node) { return node.parents; })
				.separation(function(node_a, node_b) { return (node_a.parent == node_b.parent ? 1 : .5); });
	
	// Define svg canvas infos 
	$.svg = d3.select('body').append('svg')
				.attr('width', $.widthSVG)
				.attr('height', $.heightSVG)
				.append('g')
				.attr('transform', "translate(" + $.initVariable.marginValues.left + ',' 
												+ $.initVariable.marginValues.top
												+ ')'
		);

	// parsing json data and generate graph
	$.jsonDataPath = $.initVariable.jsonDataPath;
	d3.json($.jsonDataPath, $.parsingJsondata);
}

// Define variable parameters of the parogram
$.paramtersObject = {
	flag       : 0,
	pathLength : {},
}

// Parsing json data and plot graph with svg format
$.parsingJsondata = function (error, jsonData) {
	
	// Read json data file
	if (error) throw error;
	$.nodes = $.tree(jsonData);
	$.nodeNames = new Array();
	$.each($.nodes, function (flagKey) { $.nodeNames.push($.nodes[flagKey].name); });
	
	// Adjust the position of nodes
	$.funcCatelog.adjustNodesPosition($.nodes);
	
	// Define variables for searching pathes
	$.pathInfos = new Object();
	$.path = new String();
	$.lastPileLabels = new Array();
	$.funcCatelog.searchPathes($.nodes[0], $.path);
	
	// Fix coordinates of nodes
	$.fixNodeCoordinates($.nodes, $.pathInfos);
	
	// Plot species hierarchy graph
	$.links = $.tree.links($.nodes);
	$.linkDsitance = $.linkWithDistnaceInfos.getDistanceRootWithChildren($.links);
	
	$.linkStyle = $.svg.selectAll('.link')
					.data($.links)
			 		.enter().append('path')
			 		.attr('class', 'link')
			 		.attr('d', $.linkWithDistnaceInfos.elbow);

	$.nodeStyle = $.svg.selectAll('.node')
			 		.data($.nodes)
			 		.enter().append('g')
			 		.attr('class', 'node')
			 		.attr('transform', $.linkWithDistnaceInfos.transOffset);			 				

	$.nodeStyle.append('text')
			 		.attr('class', 'name')
			 		.attr('x', function(d) {
			 			if(d.children == undefined ) {
			 				$.overallXaxis = $.initVariable.graphLayout.overallXaxis;
			 				$.spaceDistance = $.initVariable.graphLayout.rowSpaceDistance;
			 				x = (($.overallXaxis - d.y) + $.spaceDistance).toString();
			 			}
			 			else {
			 				x = "8";
			 			}
			 			return x;
			 		})
			 		.attr('y', function(d) {
			 			if(! d.children) {
			 				y = '3';
			 			}
			 			else {
			 				y = '-6';
			 			}
			 			return y; 
			 		})
			 		.text(function(node) { 
			 			$.indexLable = $.lastPileLabels.indexOf(node.name);
			 			if ($.indexLable >= 0 && $.initVariable.lastPileLablesOn !== 1) {
			 				return undefined;
			 			}
			 			if (node.name !== $.initVariable.graphLayout.rootName) { return node.name; } 
			 		});
}

$.fixNodeCoordinates = function (nodes, pathInfos) {
	$.maxPiles = new Number(0);
	$.maxPiles = $.funcCatelog.searchMaxValue($.paramtersObject.pathLength, $.maxPiles);
	
	// Calculate the horizon length
	$.unitPix = $.initVariable.graphLayout.fontPixSize;
	$.pilesWidth = new Array($.maxPiles).join('0').split('').map(parseFloat);
	
	$.each(pathInfos, function (flag) {
		$.coordinatesNodesWithLinks.calculatePilesFontPix(pathInfos[flag], $.pilesWidth, $.unitPix);
	});
	
	$.pilesWidth[$.maxPiles - 2] = $.initVariable.graphLayout.lastPileWidth;
	$.coordinatesNodesWithLinks.acumulativeHorizonal($.pilesWidth);
	
	// Calculate the hight of graph
	$.pathesNumber = Object.keys(pathInfos).length;
	$.unitRowNodeDis = $.initVariable.canvasInfos.overallHeight/($.pathesNumber + 1)
	$.graphHight = $.pathesNumber * $.unitRowNodeDis;
	
	// Calculate preliminary the coodninates of nodes
	$.nodesPilePos = new Object();	
	$.yAxisCoord = $.extend([], $.pilesWidth);
	$.xAxisCoord = $.coordinatesNodesWithLinks.preFixNodeCoordinates(nodes, $.graphHight, $.unitRowNodeDis, pathInfos);
	$.coordinatesNodesWithLinks.integrateNodesCoordinates(nodes, $.xAxisCoord, $.yAxisCoord, pathInfos);
	
	$.initVariable.graphLayout.overallXaxis = $.yAxisCoord[$.yAxisCoord.length - 1];
}

$.funcCatelog = {
	'searchPathes': function (originalNode, path) {
		path += originalNode.name + ',';
		if (originalNode.children == undefined) {
			$.pathInfos[$.paramtersObject.flag] = path;
			$.paramtersObject.pathLength[$.paramtersObject.flag] = path.split(',').length;
			$.paramtersObject.flag ++;
		}
		else {
			$.each(originalNode.children, function(updateFlag) { $.funcCatelog.searchPathes(originalNode.children[updateFlag], path); });
		}
	},
	
	'adjustNodesPosition': function (nodeInfos) {
		$.nodesDeepCopy = $.extend({}, nodeInfos);
		$.each(nodeInfos, function (infoFlag) {
			$.childrenNodes = nodeInfos[infoFlag].children;
			if ($.childrenNodes){
				$.indexValue = $.funcCatelog.sortObjWithIndex($.childrenNodes, 'children');
				$.funcCatelog.transNodesPosition($.childrenNodes, $.indexValue);				
			}
			else {
				$.noop();
			}
		});
	},
	
	'searchMaxValue': function (obj, initialValue) {
		$.each(obj, function(flag) {
			initialValue = obj[flag] > initialValue ? obj[flag] : initialValue;
		});
		return initialValue;
	},
	
	'sortObjWithIndex': function (obj, keyValue) {
		$.objValues = $.makeArray();
		$.each(obj, function (nodeFlag) {
			try {
				$.tmpLength = obj[nodeFlag][keyValue].length;
			}
			catch (err) {
				$.tmpLength = 0;
			}
			$.objValues.push($.tmpLength);
		});
		
		$.rawValues = $.extend([], $.objValues);
		$.index = new Array();
		$.objValues.sort(function (a, b) { return a < b ? -1 : a > b ? 1 : 0; });
		
		$.each($.objValues, function (flag) {
			$.index.push($.rawValues.indexOf($.objValues[flag]));
			$.rawValues[$.rawValues.indexOf($.objValues[flag])] = undefined;
		})
		
		return {'values': $.objValues, 'index': $.index};
	},
	
	'transNodesPosition': function (obj, indexValue) {
		$.each(obj, function (flag) {
			$.tmpObj = obj[flag];
			if (indexValue.index[flag] >= flag) {
				obj[flag] = obj[indexValue.index[flag]];
				obj[indexValue.index[flag]] = $.tmpObj;
			}
			else return;
		})
		return obj;
	},
};

$.coordinatesNodesWithLinks = {
	'calculatePilesFontPix': function (pathString, pilesArray, unitPix) {
		$.tmpPathList = pathString.replace('(^\s*) | (\s*$)/g').split(',').slice(0, -1);
		$.resultPixes = $.tmpPathList.map(function (fontString) { return fontString.length * unitPix; });
		$.resultPixes[0] = $.resultPixes[0] * 1.5;
		
		$.each($.resultPixes, function (flagArray) {
			pilesArray[flagArray] = $.resultPixes[flagArray] > pilesArray[flagArray] ? $.resultPixes[flagArray] : pilesArray[flagArray];
		});
	},
	
	'acumulativeHorizonal': function (numberArray) {
		$.each(numberArray, function (flag) {
			if (flag !== 0) {
				numberArray[flag] += numberArray[flag - 1]; 
			}
		})
	},
	
	'preFixNodeCoordinates': function (nodes, overallGraphHight, unitRowDis, pathInfos) {
		$.nodeChildren = new Object();
		$.nodesCoord = new Object();	
		$.pathNumbers = Object.keys(pathInfos).length;
		$.each(nodes, function (flag1) { 
			$.each(pathInfos, function (flag2) {
				$.tmpPath = pathInfos[flag2].split(',').slice(0, -1);		
				$.nodeChildren[nodes[flag1].name] = $.nodeChildren[nodes[flag1].name] || 0;
				$.nodeChildren[nodes[flag1].name] += ($.tmpPath.indexOf(nodes[flag1].name) >= 0 ? 1 : 0);
			});
		});
		
		$.each(pathInfos, function (flag) {
			$.flag = flag;
			$.coordinatesNodesWithLinks.verticalNodeCoordinates(pathInfos[flag], $.nodeChildren, unitRowDis, $.flag);
		});
		
		$.tmpValues = new Number(0);
		$.rootChildren = nodes[0].children;
		$.each($.rootChildren, function (flag) {
			$.tmpValues += $.nodesCoord[$.rootChildren[flag].name];
		});
		
		$.nodesCoord.ROOT = $.tmpValues/2;
		return $.nodesCoord;	
	},

	'verticalNodeCoordinates': function (stringNodes, nodeChildrenNum, unitRowDis, flag) {
		flag = parseInt(flag);
		$.stringNodesSplit = stringNodes.replace('(^\s*) | (\s*$)/g').split(',').slice(0, -1);	
		$.lastPileLabels.push($.stringNodesSplit[$.stringNodesSplit.length - 1]);
		
		$.each($.stringNodesSplit, function (flagNum) {
			$.nodeName = $.stringNodesSplit[flagNum];
			$.num = nodeChildrenNum[$.nodeName];
			$.nodesPilePos[$.nodeName] = [flagNum, $.stringNodesSplit.length]; 
			
			if ($.nodeName == 'ROOT') return;		
			
			if ($.nodesCoord[$.nodeName] == undefined){
				if ($.num === 1) {
					$.nodesCoord[$.nodeName] = unitRowDis * (flag + 1);
				}
				else if ($.num > 1) {
					$.nodesCoord[$.nodeName] = (((flag + 1) * unitRowDis) + ((flag + $.num) * unitRowDis))/2;
				}									
			}
		});
	},
	
	'integrateNodesCoordinates': function (nodes, axisXcoord, axisYcoord, pathInfos) {
		$.each(nodes, function (flag) {
			$.nodeName = nodes[flag].name;
			nodes[flag].x = axisXcoord[$.nodeName];
			$.index = $.nodesPilePos[$.nodeName][0];
			
			nodes[flag].y = $.index > 0 ? axisYcoord[$.index - 1] : 0
		
			if ($.index === $.nodesPilePos[$.nodeName][1] - 1) {
				nodes[flag].offset = axisYcoord[axisYcoord.length - 1] - nodes[flag].y;
			}
			else {
				nodes[flag].offset = 0;
			}
		});
	},		
}

$.linkWithDistnaceInfos = {
	'getDistanceRootWithChildren': function (links) {
		try {
			links[0].source.name === $.initVariable.graphLayout.rootName
		}
		catch (err) {
			console.log('Json format is incorrect, please give a check!');
			return undefined;
		}
		
		$.disRoot = links[0].target.y - links[0].source.y;
		links[0].source.y += links[0].source.name == $.initVariable.graphLayout.rootName ? $.disRoot : 0;
		return $.disRoot;
	},
	
	'max_min': function (obj, style) {
		$.tmpValue = new Number(0);
		$.tmpLable = new String();
		
		$.each(obj, function (flag) {
			if (style === 1) {
				$.tmpValue = obj[flag].x >= $.tmpValue ? obj[flag].x : $.tmpValue;	
			}
			else {
				$.tmpValue = (flag == 0 ? obj[flag].x : $.tmpValue);
				$.tmpValue = obj[flag].x <= $.tmpValue ? obj[flag].x : $.tmpValue;	
			} 
		});
		
		$.each(obj, function (flag) {
			$.tmpLable = obj[flag].x == $.tmpValue ? obj[flag].name : $.tmpLable;
		});
		
		return [$.tmpLable, $.tmpValue];
	},
	
	'elbow': function (link) {
		$.offset = new Number();
		$.nodeName = link.target.name;
		$.each($.nodes, function (flag) {
			if ($.nodes[flag].name == $.nodeName) {
				$.offset = $.nodes[flag].offset;
				return false;
			}
			else $.offset = 0;
		});
		
		$.roundCorner = new String();
		$.children = link.source.children;
		$.verticalValue = link.target.x;
		
		$.maxInfos = $.linkWithDistnaceInfos.max_min($.children, 1)[0];
		$.minInfos = $.linkWithDistnaceInfos.max_min($.children, 0)[0];
		
		// Handle round corner
		$.radius = $.initVariable.graphLayout.radiusCornor;
		if (link.target.name == $.minInfos) {
			$.roundCorner = "a" + $.radius + "," + $.radius + " 0 0 1 " + $.radius + "," + (-$.radius);
			$.verticalValue = (link.target.x + $.radius);
		}
		else if (link.target.name == $.maxInfos) {
			$.roundCorner = "a" + $.radius + "," + $.radius + " 0 0 0 " + $.radius + "," + $.radius;
			$.verticalValue = (link.target.x - $.radius);
		}
		else $.offset += $.radius;
		
		// link all of the nodes
		$.sourceHor = link.source.y;
		if (link.source.name !== $.initVariable.graphLayout.rootName) {
			$.sourceHor += $.radius;
		}
		return  "M" + $.sourceHor + "," + (link.source.x) + 
				"H" + (link.target.y) +
			    "V" + $.verticalValue + $.roundCorner +
			    (link.target.children ? "" : "h" + $.offset);
	},
	
	'transOffset': function (node) {
		return 'translate(' + node.y + ',' + node.x + ')';
	},
}


