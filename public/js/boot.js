console.log('f')

fetch('/manifest.json')
  .then(function(response) {
    return response.json()
  }).then(function(json) {
  console.log('parsed json', json)
}).catch(function(ex) {
  console.log('parsing failed', ex)
})


SystemJS.import('react/index.js').then(function(R) {
  console.log('import', R)
}).catch(function(ex) {
  console.log('import failed', ex)
})