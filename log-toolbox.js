// LOG TYPES definition (used mainly for automatic timestamp processing)
const TYPEKERNEL = 0

//TIMESTAMP PROCESSING

const TS_FIXEDWIDTH = 0 	// User needs to provide number of columns 
const TS_DELIMITED = 1  	// User needs to provide delimiter character 
const TS_REGEX = 2 			// USER needs to provide regexp for timestamp. Assumption is that timestamp is the first in the row 

// Const definition
const fs = require('fs')

/* Function extractTimestamp( log message, timestamp type, timestamp argument)
  
  Return an array of two string: 
    - Timestamp: parsed timestamp or empty string in case of error 
	- log message: log message  

*/ 

function extractTimestamp(logLine, ts_type , ts_arg ) {

  var logLineProcessed = [] 

  try {
    if ( ts_type === TS_FIXEDWIDTH ) { 
    logLineProcessed = [logLine.slice(0,ts_arg), logLine.slice(ts_arg)] 
    } else if ( ts_type === TS_DELIMITED ) {
      if (ts_arg.indexOf('*') > -1) { 
        //User specified a wildcard character 
	    ts_arg = (ts_arg.replace('\[', '\\[')).replace('\]', '\\]').replace('\)', '\\)').replace('\(','\\(').replace('*', '(.*?)')	// Transform argument adding escapes '\' and converting '*' to '(.*?)'
	    var re = new RegExp(ts_arg + "(.*)")	// Added '(.*?)' to catch everything else in the string 
	    logLineProcessed = [ re.exec(logLine)[1], re.exec(logLine)[2] ] 
      } else {
        posDelimiter = logLine.indexOf(ts_arg)
        if (posDelimiter > 0) {
          logLineProcessed = [ logLine.slice(0,posDelimiter), logLine.slice(posDelimiter + 1) ]
        } else {
          logLineProcessed = [ '', logLine]
        }
      }
    } else if ( ts_type === TS_REGEX ) {
	  var re = new RegExp(ts_arg.replace('\\', '\\\\') + "(.*)")
	  console.log(re)
	  logLineProcessed = [ re.exec(logLine)[1], re.exec(logLine)[2] ] 
    }
    return logLineProcessed
  } catch (err) {
	  console.log("extractTimestamp: Error " + err)
	  return ["", logLine] 
  }
}

/* Function preProcessLog( log , [ timestamp type ],  [timestamp type] ) 

  This function return an array of object parsing an array of log lines. The
  object returned is defined as:

  {
    lineNum: line num of the log message in the original log
    timestamp: Timestamp (if any)
    log: Log message
  }

  It can be used to parse the timestamp, remove file header / footer, etc ...

*/

function preProcessLog (logLines, ts_type, ts_arg) {
  
  // Defaulting timestamp parameters (or upgrade to node v6+) 
  ts_type = (typeof ts_type !== 'undefined') ?  ts_type : 0;
  ts_arg = (typeof ts_arg !== 'undefined') ?  ts_arg : 0;
  
  var logProcessed = []
  
  logLines.forEach(function (element, index) {
	var logMessageTimestamp = 
    logProcessed.push({lineNum: index, timestamp: "", log: element})
  })

  return logProcessed
}

/* Function compareLogs( array of logs, index of first log, index of log to compare to the first)

  This function returns two arrays:

  First one is the first log (logA) where each log object has a new property added
  to report if a similar element has been found in the second log:

  {
    lineNum: line num of the log message in the original log
    lineNumB: Line num of the log message in the compared log. -1 if
    it doesn't appear in the compared log
    timestamp: Timestamp
    log: Log Message
  }

  Second returned array is an array whith the element of the second log that has
  not been found in the first array

*/
function compareLogs (logs, a, b) {
 // Compare logs[a] and logs[b]

  var logA = logs[a].slice() // Create a copy of the first log. Code is adding lineNumSecond to each line object
  var logB = logs[b].slice() //  Create a copy of the second log. Code is removing found elements
  var indexLogB = 0

  logA.forEach(function (elementLogA) {
    indexLogB = logB.findIndex(function (elementLogB) {
      return elementLogA.log === elementLogB.log
    })
    if (indexLogB >= 0) {
      elementLogA.lineNumB = logB[indexLogB].lineNum
      logB.splice(indexLogB, 1) // Remove the element we found from the second log
    } else {
      elementLogA.lineNumB = -1
    }
  })

  return [ logA, logB ]
}

/* Function writeLogToFile()

  Create a file with the content of the array of log obejects

*/
function writeLogToFile (filename, log) {
  var logToStr = ''
  log.forEach(function (element) {
    if (element.lineNumB !== -1) {
      logToStr += '== [' + element.lineNumB + '] '
    }
    logToStr += element.timestamp + ' ' + element.log + '\n'
  })
  fs.writeFileSync(filename + '_compared', logToStr, 'utf8')
  fs.writeFileSync
}

/* CURRENTLY NOT USED: openFileAsStream

  Open a file as a read stream

*/

function openFileStream () {
  const readline = require('readline')

  const rl = readline.createInterface({
    input: fs.createReadStream(logFileName)
  })

  rl.on('line', function (line) {
    console.log('Line from file:', line)
  })
}

/* test functions */

function testComparison () {
  ///var logFiles = ['samples\\files_py.txt', 'samples\\files_pyc.txt']
  var logFiles = ['C:\\_ce\\customers\\freebox\\_issues\\recompile_freebox_kernel\\without_weston\\upstart_not_working.log_notimestamp', 'C:\\_ce\\customers\\freebox\\_issues\\recompile_freebox_kernel\\without_weston\\upstart_working.log_notimestamp']
  var logs = [] // Array of all logs read
  var logsCompared = []

  logFiles.forEach(function (logFileName) {
    logs.push(preProcessLog(fs.readFileSync(logFileName, 'utf8').split('\n')))
  })

  logsCompared = compareLogs(logs, 0, 1)

  writeLogToFile(logFiles[0], logsCompared[0])
  writeLogToFile(logFiles[1], logsCompared[1])

  console.log('Output in file ' + logFiles[0] + '_compared')
}

function testTimestampParsing () {
  
  var logLine = "[2010-01-01 00:00:00] [ERROR] upst[597]: fbxdev: >>  [dev] coldboot: unknown subsystem 'msm-bus-type' for '/devices/mas-cnoc-a2noc'"

  console.log("Default:")
  console.log(extractTimestamp(logLine)) 								// "", "[2010-01-01 00:00:00] [ERROR] upst[597]: fbxdev: >>  [dev] coldboot: unknown subsystem 'msm-bus-type' for '/devices/mas-cnoc-a2noc'"
  console.log("Fixed at 10 chars:")
  console.log(extractTimestamp(logLine, TS_FIXEDWIDTH, 10 ))			// "[2010-01-0", "1 00:00:00] [ERROR] upst[597]: fbxdev: >>  [dev] coldboot: unknown subsystem 'msm-bus-type' for '/devices/mas-cnoc-a2noc'"
  console.log("Delimited by ':':")
  console.log(extractTimestamp(logLine, TS_DELIMITED, ":" ))			// "[2010-01-01 00", "00:00] [ERROR] upst[597]: fbxdev: >>  [dev] coldboot: unknown subsystem 'msm-bus-type' for '/devices/mas-cnoc-a2noc'"
  console.log("Delimited with wildcard by '[*]':")
  console.log(extractTimestamp(logLine, TS_DELIMITED, "[*]" ))			// "[2010-01-01 00", "00:00] [ERROR] upst[597]: fbxdev: >>  [dev] coldboot: unknown subsystem 'msm-bus-type' for '/devices/mas-cnoc-a2noc'"
  console.log("RegExp:")
  console.log(extractTimestamp(logLine, TS_REGEX, "\\[(.*?)\\]" ))		// "2010-01-01 00:00:00", " [ERROR] upst[597]: fbxdev: >>  [dev] coldboot: unknown subsystem 'msm-bus-type' for '/devices/mas-cnoc-a2noc'"

}
/* End test functions */ 

/* MAIN */

//testComparison()
//testTimestampParsing()

