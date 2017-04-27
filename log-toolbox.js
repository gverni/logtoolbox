// LOG TYPES definition (used mainly for automatic timestamp processing)
const TYPEKERNEL = 0

// Const definition
const fs = require('fs')

/* Function preProcessLog( log )
  This function return an array of object parsing an array of log lines. The
  object returned is defined as:

  {
    lineNum: line num of the log message in the original log
    timestamp: Timestamp (if any)
    log: Log message
  }

  It can be used to parse the timestamp, remove file header / footer, etc ...

*/

function preProcessLog (logLines) {
  var logProcessed = []
  logLines.forEach(function (element, index) {
    logProcessed.push({lineNum: index, timestamp: '', log: element})
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

/* test function  */

function executeTest () {
  var logFiles = ['samples\\files_py.txt', 'samples\\files_pyc.txt']
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

/* MAIN */

executeTest()

