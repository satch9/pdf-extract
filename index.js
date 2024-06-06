import express from "express";
import fileUpload from "express-fileupload";
import path from "path";
import fs from "fs";
import { PDFExtract } from "pdf.js-extract";

const app = express();
const PORT = process.env.PORT || 3000;
const pathPublic = path.resolve("public");
const samplesPath = path.join(pathPublic, "../samples/");
//const renamePath = path.join("/workspaces/pdf-extract/", "samples/")
const renamePath = path.join(
  "C:/Users/Utilisateur/Documents/Développement/CGSS/pdf-extract/",
  "samples/"
);

app.use("/", express.static(pathPublic));
app.use(fileUpload());

app.post("/upload", (req, res) => {
  let pdfFile;
  let uploadPath;
  let newNameFile;
  let dateSynchronisation;

  getCurrentFilenames();

  if (!req.files && !req.files.pdfFile) {
    return res.status(400).json({ message: "No file uploaded" });
  }
  dateSynchronisation = String(req.body.dateJournalFluxSynchronisation);
  console.log("dateSynchronisation", dateSynchronisation);
  pdfFile = req.files.pdfFile;
  const oldNameFile = pdfFile.name;
  uploadPath = path.join(samplesPath, pdfFile.name);
  console.log("uploadPath", uploadPath);

  /* if (!fs.existsSync(samplesPath)) {
    fs.mkdirSync(samplesPath);
  }*/
  fs.writeFileSync(uploadPath, pdfFile.data);

  const pdfExtract = new PDFExtract();
  const options = {};

  //const buffer = fs.readFileSync(uploadPath)

  pdfExtract.extract(String(uploadPath), options, (err, data) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ message: "Error extracting PDF" });
    } else {
      let allPagesData = [];

      data.pages.forEach((page) => {
        allPagesData = allPagesData.concat(page.content);
      });
      
      allPagesData.content.map((element) => {
        if (
          element.str
            .toLowerCase()
            .includes(
              "modification agent dans le flux de synchronisation fichier: "
            )
        ) {
          newNameFile = element.str.split(": ")[1];

          const filePath = `${renamePath}${newNameFile}.pdf`;
          if (fs.existsSync(filePath)) {
            const erasePath = `${renamePath}/${oldNameFile}`;
            console.log("erasePath", erasePath);
            fs.unlink(String(erasePath), (err) => {
              if (err) {
                console.log(err);
                return res
                  .status(500)
                  .json({ message: "Erreur pour effacer le old file" });
              }
              console.log("fichier a été effacé.");
            });
            return res
              .status(400)
              .json({ message: "Le fichier existe déjà.", data: {} });
          } else {
            let dataTable = createJsonFromTable(
              allPagesData.splice(
                12,
                allPagesData.length - 12
              ),
              newNameFile,
              dateSynchronisation
            );
            const modifiedObj = removeSpecificElementsFromObjectArray(
              dataTable,
              newNameFile
            );

            fs.rename(
              String(uploadPath),
              `${renamePath}${newNameFile}.pdf`,
              (err) => {
                if (err) {
                  console.log(err);
                  return res
                    .status(500)
                    .json({ message: "Erreur de renoomage du fichier" });
                } else {
                  console.log("Fichier renommé avec succès");
                }
              }
            );
            return res.status(200).json({
              message: "Fichier téléchargé et renommé avec succès",
              data: modifiedObj,
            });
          }
        }
      });
    }
  });
});

function getCurrentFilenames() {
  console.log("Current filenames:");
  fs.readdirSync(samplesPath).forEach((file) => {
    console.log(file);
  });
}

function createJsonFromTable(data, name, dateSynchronisation) {
  const result = {};
  const agentsMap = new Map();

  let currentAgent = null;

  data.forEach((element) => {
    const x = Math.round(element.x);

    if (x === 40) {
      currentAgent = element.str;

      if (!agentsMap.has(currentAgent)) {
        agentsMap.set(currentAgent, {
          numAgent: extractAgentNumber(currentAgent),
          agent: currentAgent,
          entite: "",
          dateSynchronisation: dateSynchronisation,
          lignes: [],
        });
      }
    } else if (x === 265) {
      if (currentAgent) {
        agentsMap.get(currentAgent).entite += element.str + " ";
      }
    } else if (x === 431 || x === 432) {
      if (currentAgent) {
        agentsMap.get(currentAgent).lignes.push({
          action: element.str,
          modification: "",
          avant: "",
          apres: "",
        });
      }
    } else if (x === 455) {
      if (currentAgent) {
        const lignes = agentsMap.get(currentAgent).lignes;
        lignes[lignes.length - 1].modification = element.str;
      }
    } else if (x === 605) {
      if (currentAgent) {
        const lignes = agentsMap.get(currentAgent).lignes;
        lignes[lignes.length - 1].avant = element.str;
      }
    } else if (x === 705) {
      if (currentAgent) {
        const lignes = agentsMap.get(currentAgent).lignes;
        lignes[lignes.length - 1].apres = element.str;
      }
    }
  });

  result[name] = Array.from(agentsMap.values());
  return result;
}

function removeSpecificElementsFromObjectArray(obj, key) {
  /* if (obj[key] && Array.isArray(obj[key])) {
    // Remove the last two elements from the array
    obj[key].splice(-2, 2);
  }
  return obj; */
  if (obj[key] && Array.isArray(obj[key])) {
    obj[key] = obj[key].filter(element => {
      return !(element.numAgent === null)
    });
  }
  return obj;
}

function extractAgentNumber(agentString) {
  const regex = /\((\d+)\)/;
  const match = agentString.match(regex);

  if (match) {
    return Number(match[1]);
  } else {
    return null;
  }
}

app.listen(PORT, () =>
  console.log(`server running on http://localhost:${PORT}`)
);
