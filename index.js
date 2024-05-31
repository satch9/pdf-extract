import express from 'express'
import fileUpload from 'express-fileupload'
import path from 'path'
import fs from 'fs'
import { PDFExtract } from 'pdf.js-extract'
import { log } from 'console'

const app = express()
const PORT = process.env.PORT || 3000
const pathPublic = path.resolve('public')
const samplesPath = path.join(pathPublic, '../samples/')
const renamePath = path.join('/workspaces/pdf-extract', '/samples/')

app.use('/', express.static(pathPublic))
app.use(fileUpload())

app.post('/upload', (req, res) => {
  let pdfFile
  let uploadPath
  let newNameFile

  getCurrentFilenames()

  if (!req.files && !req.files.pdfFile) {
    return res.status(400).json({ message: 'No file uploaded' })
  }
  console.log('req.files.pdfFile', req.files.pdfFile)

  pdfFile = req.files.pdfFile

  uploadPath = samplesPath + pdfFile.name
  console.log('uploadPath', uploadPath)

  if (!fs.existsSync(samplesPath)) {
    fs.mkdirSync(samplesPath)
  }
  fs.writeFileSync(uploadPath, pdfFile.data)

  const pdfExtract = new PDFExtract()
  const options = {}

  //const buffer = fs.readFileSync(uploadPath)

  pdfExtract.extract(String(uploadPath), options, (err, data) => {
    if (err) {
      console.log(err)
      return res.status(500).json({ message: 'Error extracting PDF' })
    } else {
      /* console.log(
        'data.pages[0].pageInfo extractData.js',
        data.pages[0].pageInfo,
      ) */
      console.log('data.pages[0].content extractData.js', data.pages[0].content)

      data.pages[0].content.map((element,index)=>{
        if(index>11){
          let json = createJsonFromTable(data.pages[0].content)
          console.log("json",json)
        }
      })
      

      const targetElement = data.pages[0].content.find((element) => {
        return element.str.indexOf(
          'Modification Agent dans le flux de synchronisation fichier:',
        )!== -1
      })

      if (targetElement) {
        newNameFile = targetElement.str.slice(59, 75)
        console.log("newNameFile",newNameFile)

        fs.rename(String(uploadPath), `${renamePath}${newNameFile}.pdf`, (err) => {
          if (err) {
            console.log(err)
            return res.status(500).json({ message: 'Error renaming file' })
          } else {
            console.log('File renamed successfully')
            return res
             .status(200)
             .json({ message: 'File uploaded and renamed successfully' })
          }
        })
      }
    }
  })

})


function getCurrentFilenames() {
  console.log('Current filenames:')
  fs.readdirSync(samplesPath).forEach((file) => {
    console.log(file)
  })
}

function createJsonFromTable(data) {
  const json = []

  for (const item of data) {
    const jsonItem = {
      agent: item.str.slice(0, 8),
      entiteDeRattachement: item.str.slice(8, 27),
      action: item.str.slice(27, 33),
      modification: item.str.slice(33, 42),
      avant: item.str.slice(42, 51),
      apres: item.str.slice(51, 60)
    }
    json.push(jsonItem)
  }
  return json
}


app.listen(PORT)
