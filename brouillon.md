/* const pdfFile = req.files.sampleFile

  const pdfExtract = new PDFExtract()
  const options = {}

  pdfExtract.extract(pdfFile.data, options, (err, data) => {
    if (err) {
      console.log(err)
      return res.status(500).json({ message: 'Error extracting text' })
    } else {
      console.log(
        'data.pages[0].pageInfo extractData.js',
        data.pages[0].pageInfo,
      )
      console.log('data.pages[0].content extractData.js', data.pages[0].content)
      // Process the extracted text as needed
    }
  }) */

  /*
 const tab = document.createElement('div')
const thead = document.createElement('thead')
const tbody = document.createElement('tbody')

const headers = [
  'Agent',
  'Entité de rattachement',
  'Action',
  'Modification',
  'Avant',
  'Après',
]

headers.forEach((header) => {
  const th = document.createElement('th')
  th.textContent = header
  thead.appendChild(th)
})

tab.appendChild(thead)

tableData.forEach((row) => {
  const tr = document.createElement('tr')
  Object.values(row).forEach((value) => {
    const td = document.createElement('td')
    td.textContent = value
    tr.appendChild(td)
  })

  tbody.appendChild(tr)
})

tab.appendChild(tbody)

document.body.appendChild(tab) */