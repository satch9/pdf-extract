import express from 'express'
import fileUpload from 'express-fileupload'
import path from 'path'
import fs from 'fs'
import { PDFExtract } from 'pdf.js-extract'

const app = express()
const PORT = process.env.PORT || 3000
const pathPublic = path.resolve('public')
const samplesPath = path.join(pathPublic, '../samples/')
const renamePath = path.join('/workspaces/pdf-extract/', 'samples/')

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
      /* console.log('data.pages[0].content extractData.js', data.pages[0].content) */

      data.pages[0].content.map((element) => {
        if (
          element.str
            .toLowerCase()
            .includes(
              'modification agent dans le flux de synchronisation fichier: ',
            )
        ) {
          //console.log('element.str', element.str)
          newNameFile = element.str.split(': ')[1]
          fs.rename(
            String(uploadPath),
            `${renamePath}${newNameFile}.pdf`,
            (err) => {
              if (err) {
                console.log(err)
                return res.status(500).json({ message: 'Error renaming file' })
              } else {
                console.log('File renamed successfully')
                return res
                  .status(200)
                  .json({ message: 'File uploaded and renamed successfully' })
              }
            },
          )
        }
      })
      /* console.log('data.pages[0].content extractData.js', data.pages[0].content.splice(12, data.pages[0].content.length - 11)) */

      let dataTable = createJsonFromTable(
        data.pages[0].content.splice(12, data.pages[0].content.length - 11),
        newNameFile,
      )
      //console.log("dataTable",dataTable)
    }
  })
})

function getCurrentFilenames() {
  console.log('Current filenames:')
  fs.readdirSync(samplesPath).forEach((file) => {
    console.log(file)
  })
}

function createJsonFromTable(data, name) {
  const result = {}
  const result_agents = {
    agent: '',
    entite: '',
    action: '',
    modification: '',
    avant: '',
    apres: '',
  }
  const agentsArray = []
  //console.log("data",data)

  data.forEach((element, index) => {
    /* if (index >= 0 && index <= 5) {
      console.log('element', element, Math.round(element.x))
    } */

    if (Math.round(element.x) === 40) {
      if (result_agents.agent !== '') {
        agentsArray.push({ ...result_agents })
        result_agents.agent = ''
        result_agents.entite = ''
        result_agents.action = ''
        result_agents.modification = ''
        result_agents.avant = ''
        result_agents.apres = ''
      }
      result_agents.agent = element.str
    } else if (Math.round(element.x) === 265) {
      result_agents.entite += element.str + ' '
    } else if (Math.round(element.x) === 431 || Math.round(element.x) === 432) {
      result_agents.action = element.str
    } else if (Math.round(element.x) === 455) {
      result_agents.modification = element.str
    } else if (Math.round(element.x) === 605) {
      result_agents.avant = element.str
    } else if (Math.round(element.x) === 705) {
      result_agents.apres = element.str
    }
  })

  if (result_agents.agent !== '') {
    agentsArray.push({ ...result_agents });
  }

  result[name] = agentsArray
  return result
}

app.listen(PORT)
