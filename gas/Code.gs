function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Cotizador SF Lodge v2');
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
