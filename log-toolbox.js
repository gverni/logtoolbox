//LOG TYPES definition
const TYPEKERNEL = 0  

// Const definition 

const fs = require('fs')

// Functions defintition 

function preProcessLog(logLines) {

	//TODO: in this function we should to preprocessing of logs, e.g. remove timesptamps, headers, etc... 
	var logProcessed = []
	logLines.forEach(function(element, index) {
		logProcessed.push({lineNum: index, timestamp: "", log: element})
	})
	
	return logProcessed 
}

/* Function cpompareLogs( array of logs, index of first log, index of log to compare to the first)
	This function returns two arrays: 

	First one is the first log (logA) where each log object has a new property added 
	to report if a similar element has been found in the second log: 

		{
			lineNum: line num of the log message in the original log 
			lineNumB: Line num of the log message in the compared log 
			timestamp: Timestamp 
			log: Log Message 
		}

	Second returned array is an array whith the element of the second log that has 
	not been found in the first array 

*/ 
function compareLogs(logs, a, b) { // Compare logs[a] and logs[b]

	logA = logs[a].slice() // Create a copy of the first log. Code is adding lineNumSecond to each line object 
	logB = logs[b].slice() //  Create a copy of the second log. Code is removing found elements 
	logA.forEach( function (elementLogA) {
		indexLogB = logB.findIndex( function (elementLogB) {
			return elementLogA.log === elementLogB.log 
		}) 
		if ( indexLogB >= 0 ) {
			elementLogA.lineNumB = logB[indexLogB].lineNum 
			logB.splice(indexLogB, 1) //Remove the element we found from the second log
		} else {
			elementLogA.lineNumB = -1
		}
	}) 
	
	return [ logA, logB ]
}

var logFiles = ["samples\\files_py.txt", "samples\\files_pyc.txt"]
var logs = [] // Array of all logs read 
var logsCompared = []

logFiles.forEach( function (logFileName) {
	logLines = fs.readFileSync(logFileName, 'utf8').split('\n') // TODO: Assuming file type is UTF8
	logs.push(preProcessLog(logLines)) 
})

logsCompared = compareLogs(logs, 0, 1)
console.log(logsCompared[0])


logsCompared[0].forEach(


)


/* 
const readline = require('readline')

const rl = readline.createInterface({
      input: fs.createReadStream(logFileName)
 })
 
 rl.on('line', function (line) {
	console.log('Line from file:', line)
 })*/ 
 
