var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
import_dotenv.default.config();
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json());
var GEMINI_API_KEY = process.env.GEMINI_API_KEY || "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";
var ai = null;
var isNvidiaKey = GEMINI_API_KEY.startsWith("nvapi-");
if (GEMINI_API_KEY && !isNvidiaKey) {
  ai = new import_genai.GoogleGenAI({
    apiKey: GEMINI_API_KEY,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
}
app.get("/api/logo", (req, res) => {
  res.sendFile(import_path.default.join(process.cwd(), "WhatsApp Image 2026-04-15 at 4.41.33 PM.jpeg"));
});
app.post("/api/refine-tasks", async (req, res) => {
  const { rawNotes, deviceType, deviceBrand, clientName, clientTitle, clientDepartment } = req.body;
  if (!rawNotes || typeof rawNotes !== "string") {
    res.status(400).json({ error: "Les notes brutes (rawNotes) sont requises." });
    return;
  }
  if (isNvidiaKey) {
    try {
      console.log("[CNIPLC API] Using NVIDIA NIM Engine Llama model...");
      const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GEMINI_API_KEY}`
        },
        body: JSON.stringify({
          model: "meta/llama-3.1-70b-instruct",
          messages: [
            {
              role: "system",
              content: "Vous \xEAtes un assistant IA de r\xE9daction administrative d'\xC9tat d'\xE9lite rattach\xE9 au CNIPLC (Centre National d'Informatique) de la R\xE9publique de Djibouti. Votre r\xF4le est d'aider les techniciens \xE0 reformuler leurs notes rapides en rapports d'intervention haut de gamme, r\xE9dig\xE9s dans un fran\xE7ais officiel, clair, soutenu et rigoureux. Vous devez imp\xE9rativement int\xE9grer de fa\xE7on naturelle l'ensemble des donn\xE9es du formulaire : l'appareil r\xE9solu, sa marque, le nom complet du b\xE9n\xE9ficiaire, son titre/fonction et son d\xE9partement minist\xE9riel d'affectation pour produire un texte sur-mesure. Vous devez obligatoirement renvoyer vos r\xE9ponses au format JSON strict avec les cl\xE9s de premier niveau suivantes :\n1. 'professionalSummary': un compte rendu global, r\xE9dig\xE9, fluide et respectueux d\xE9crivant l'ensemble de la prestation de service fait en fran\xE7ais administratif, mentionnant le b\xE9n\xE9ficiaire, son titre, son d\xE9partement, et l'atteinte de la r\xE9paration.\n2. 'tasks': une liste d'actes techniques pr\xE9cis (array d'objets) contenant chacun 'description' (le libell\xE9 de l'acte technique pr\xE9cis r\xE9dig\xE9 de fa\xE7on professionnelle et d\xE9taill\xE9e, ex: 'Maintenance physique curative par d\xE9montage, d\xE9poussi\xE9rage et remplacement de barrette m\xE9moire active') et 'category' (obligatoirement l'un des choix suivants: 'Mat\xE9riel', 'Logiciel', 'R\xE9seau', 'S\xE9curit\xE9', 'Optimisation', 'Autre')."
            },
            {
              role: "user",
              content: `\xC9quipement: ${deviceType || "Ordinateur"} (${deviceBrand || "Standard"})
B\xE9n\xE9ficiaire d'\xC9tat: ${clientName || "Collaborateur"} - ${clientTitle || "Fonctionnaire"} au sein du service : ${clientDepartment || "Dossier Technique"}
Notes brutes et rapides du technicien \xE0 formuler : "${rawNotes}"`
            }
          ],
          temperature: 0.2,
          max_tokens: 1024,
          response_format: { type: "json_object" }
        })
      });
      if (!response.ok) {
        throw new Error(`Erreur API NVIDIA: ${response.status} ${response.statusText}`);
      }
      const nvData = await response.json();
      const contentText = nvData?.choices?.[0]?.message?.content;
      if (contentText) {
        let cleaned = contentText.trim();
        if (cleaned.startsWith("```")) {
          cleaned = cleaned.replace(/^```json/i, "").replace(/```$/s, "").trim();
        }
        const parsedData = JSON.parse(cleaned);
        res.json(parsedData);
        return;
      } else {
        throw new Error("Contenu vide retourn\xE9 par l'API NVIDIA.");
      }
    } catch (nvErr) {
      console.error("[CNIPLC API] NVIDIA Engine Error:", nvErr);
    }
  } else if (ai) {
    try {
      console.log("[CNIPLC API] Using Gemini AI Engine...");
      const prompt = `Notes brutes du technicien: "${rawNotes}"
\xC9quipement concern\xE9: ${deviceType || "PC"} (Marque: ${deviceBrand || "Standard"})
B\xE9n\xE9ficiaire: ${clientName || "Collaborateur"} (${clientTitle || "Fonctionnaire"})
Secteur/D\xE9partement: ${clientDepartment || "Dossier Technique"}

Formulez ceci de mani\xE8re extr\xEAmement professionnelle en ins\xE9rant intelligemment et formellement ces informations dans un style d'attestation administrative officielle d'\xC9tat de style R\xE9publique de Djibouti.`;
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "Vous \xEAtes un expert IA des r\xE9dactions techniques et administratives de haut niveau pour l'\xC9tat, rattach\xE9 au CNIPLC (Centre National d'Informatique) de la R\xE9publique de Djibouti. Votre mission est d'aider les techniciens \xE0 transformer leurs notes d'intervention rapides (ex: 'depan pc ram qui rame') en rapports techniques d'intervention hautement professionnels, r\xE9dig\xE9s en fran\xE7ais officiel, \xE9l\xE9gant, soutenu et pr\xE9cis. Int\xE9grez intelligemment le b\xE9n\xE9ficiaire, sa fonction officielle, son direction/d\xE9partement, ainsi que le mat\xE9riel et sa marque dans un compte rendu global parfait. S\xE9parez l'intervention en une synth\xE8se globale formelle personnalis\xE9e ('professionalSummary') et une s\xE9rie d'actions techniques atomiques ('tasks') cat\xE9goris\xE9es.",
          responseMimeType: "application/json",
          responseSchema: {
            type: import_genai.Type.OBJECT,
            properties: {
              professionalSummary: {
                type: import_genai.Type.STRING,
                description: "Une synth\xE8se r\xE9dig\xE9e polie et hautement professionnelle d\xE9crivant l'ensemble de l'op\xE9ration en fran\xE7ais de style officiel en int\xE9grant le b\xE9n\xE9ficiaire, sa fonction, son d\xE9partement, le mat\xE9riel r\xE9solu et la r\xE9solution positive de la panne."
              },
              tasks: {
                type: import_genai.Type.ARRAY,
                description: "La d\xE9composition des actions de maintenance et d'assistance concr\xE8tes r\xE9alis\xE9es.",
                items: {
                  type: import_genai.Type.OBJECT,
                  properties: {
                    description: {
                      type: import_genai.Type.STRING,
                      description: "Une phrase courte et claire d\xE9crivant l'action pr\xE9cise r\xE9alis\xE9e (ex: 'D\xE9montage interne, d\xE9pollution m\xE9canique des composants et mise \xE0 niveau de la RAM DDR4 8Go')."
                    },
                    category: {
                      type: import_genai.Type.STRING,
                      enum: ["Mat\xE9riel", "Logiciel", "R\xE9seau", "S\xE9curit\xE9", "Optimisation", "Autre"],
                      description: "La classification de l'action technique."
                    }
                  },
                  required: ["description", "category"]
                }
              }
            },
            required: ["professionalSummary", "tasks"]
          }
        }
      });
      const outputText = response.text;
      if (outputText) {
        const parsedData = JSON.parse(outputText.trim());
        res.json(parsedData);
        return;
      } else {
        throw new Error("Pas de texte retourn\xE9 par Gemini.");
      }
    } catch (error) {
      console.error("[CNIPLC API] Gemini Engine Error:", error);
    }
  }
  console.log("[CNIPLC API] Serving static fallback payload.");
  res.json({
    professionalSummary: `Prestation de support informatique et de maintenance corrective officiellement effectu\xE9e avec succ\xE8s au profit de ${clientName || "l'agent d'\xC9tat"} (${clientTitle || "Fonctionnaire"}), affect\xE9(e) au d\xE9partement ${clientDepartment || "Technique"}. L'appareil de type ${deviceType || "informatique"} (mod\xE8le : ${deviceBrand || "Standard"}) a \xE9t\xE9 r\xE9vis\xE9, inspect\xE9 et r\xE9tabli dans un \xE9tat de fonctionnement optimal suite \xE0 l'\xE9v\xE9nement technique : ${rawNotes}.`,
    tasks: [
      { description: "Analyse diagnostique cibl\xE9e des dysfonctionnements physiques et logiciels sur site d'\xC9tat", category: "Autre" },
      { description: `D\xE9pannage technique curatif sur mat\xE9riel ${deviceBrand || "Standard"} : ${rawNotes}`, category: "Mat\xE9riel" }
    ]
  });
});
app.post("/api/notify-telegram", async (req, res) => {
  const body = req.body;
  const BOT_TOKEN = "8774455137:AAFMkDkKbtk0I8qX05R1GAfE8EZbtQyKPe0";
  const CHAT_ID = "7497438912";
  if (!BOT_TOKEN || !CHAT_ID) {
    console.error("Local Environment Variables TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID are missing.");
    res.status(500).json({ error: "Server misconfiguration" });
    return;
  }
  const emojiType = {
    bug: "\u{1F41B}",
    acces: "\u{1F510}",
    fonctionnalite: "\u2728",
    incident: "\u26A0\uFE0F",
    autre: "\u{1F4CC}"
  };
  const emojiPriority = {
    basse: "\u{1F7E2}",
    moyenne: "\u{1F7E1}",
    haute: "\u{1F7E0}",
    urgente: "\u{1F534}"
  };
  const message = `
\u{1F6A8} *NOUVEAU SIGNALEMENT \u2014 CNIPLC*

*Agent:* ${body.agentName}
*Contact:* ${body.contact}
*Type:* ${emojiType[body.type] || "\u{1F4CB}"} ${body.type}
*Priorit\xE9:* ${emojiPriority[body.priority] || "\u26AA"} ${body.priority}

*Description:*
\`\`\`
${body.description}
\`\`\`

\u23F0 *Re\xE7u le:* ${body.timestamp}
  `.trim();
  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: "Markdown"
      })
    });
    if (!response.ok) {
      const tgError = await response.text();
      console.error("Telegram API error:", tgError);
      throw new Error("Telegram API error");
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Error sending to telegram:", error);
    res.status(500).json({ success: false, error: "Failed to send to Telegram" });
  }
});
app.post("/api/parse-voice", async (req, res) => {
  const { transcript } = req.body;
  if (!transcript || typeof transcript !== "string") {
    res.status(400).json({ error: "La transcription vocale (transcript) est requise." });
    return;
  }
  const currentDateStr = (/* @__PURE__ */ new Date()).toISOString().substring(0, 10);
  if (isNvidiaKey) {
    try {
      console.log("[CNIPLC API Voice] Using NVIDIA NIM Engine Llama model...");
      const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GEMINI_API_KEY}`
        },
        body: JSON.stringify({
          model: "meta/llama-3.1-70b-instruct",
          messages: [
            {
              role: "system",
              content: "Vous \xEAtes un assistant IA de saisie d'intervention d'\xE9lite rattach\xE9 au CNIPLC (Republique de Djibouti). Votre r\xF4le est d'analyser la transcription vocale d'une intervention et d'extraire toutes les informations demand\xE9es sous forme de JSON strict. Vous devez renvoyer un objet JSON contenant exactement ces cl\xE9s :\n1. 'clientName': le nom complet du b\xE9n\xE9ficiaire de l'intervention (ex: 'M. Ammad').\n2. 'clientTitle': sa fonction administrative (ex: 'Chef de service').\n3. 'clientDepartment': son d\xE9partement ou service (ex: 'Ressources Humaines' ou le service d'affectation sp\xE9cifi\xE9).\n4. 'deviceType': le type d'appareil (ex: 'PC Portable', 'PC de Bureau', 'Imprimante', 'Switch').\n5. 'deviceBrand': la marque/mod\xE8le de l'appareil (ex: 'Dell', 'HP', 'Standard').\n6. 'date': la date de l'intervention au format strict 'YYYY-MM-DD'. D\xE9terminez la date d'apr\xE8s le texte (ex: 'Thursday, December 21st, 2021' -> '2021-12-21'). S'il n'y a pas de date ou de d\xE9tails pr\xE9cis, consid\xE9rez une date intelligente ou aujourd'hui : '" + currentDateStr + "'.\n7. 'rawNotes': le compte rendu technique brut \xE9crit rapidement (ex: 'D\xE9p\xF4t d'un PC portable Dell Vostro, installation propre de Windows 11 et augmentation de la RAM \xE0 16Go DDR4').\n8. 'professionalSummary': un r\xE9sum\xE9 officiel poli et r\xE9dig\xE9 (1 \xE0 2 phrases) en fran\xE7ais soutenu pour le livrable (ex: 'Mise \xE0 disposition et param\xE9trage d'un ordinateur portable avec mise en service du syst\xE8me d'exploitation Windows 11 pour garantir la continuit\xE9 des affaires du b\xE9n\xE9ficiaire.').\n9. 'tasks': un tableau d'objets contenant chacun 'description' (ex: 'Installation compl\xE8te de l'OS Windows 11') et 'category' ('Mat\xE9riel', 'Logiciel', 'R\xE9seau', 'S\xE9curit\xE9', 'Optimisation', 'Autre')."
            },
            {
              role: "user",
              content: `Voici la transcription audio brute du technicien \xE0 analyser : "${transcript}"`
            }
          ],
          temperature: 0.1,
          max_tokens: 1500,
          response_format: { type: "json_object" }
        })
      });
      if (!response.ok) {
        throw new Error(`Erreur API NVIDIA: ${response.status} ${response.statusText}`);
      }
      const nvData = await response.json();
      const contentText = nvData?.choices?.[0]?.message?.content;
      if (contentText) {
        let cleaned = contentText.trim();
        if (cleaned.startsWith("```")) {
          cleaned = cleaned.replace(/^```json/i, "").replace(/```$/s, "").trim();
        }
        res.json(JSON.parse(cleaned));
        return;
      }
    } catch (nvErr) {
      console.error("[CNIPLC API Voice] NVIDIA Engine Error:", nvErr);
    }
  } else if (ai) {
    try {
      console.log("[CNIPLC API Voice] Using Gemini AI Engine...");
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Analysez cette transcription audio d'intervention : "${transcript}" et transformez la en objet JSON structur\xE9.`,
        config: {
          systemInstruction: "Vous \xEAtes un assistant IA de saisie d'intervention d'\xE9lite rattach\xE9 au CNIPLC (Republique de Djibouti). Votre r\xF4le est d'analyser la transcription vocale d'une intervention et d'extraire toutes les informations demand\xE9es sous forme de JSON strict. Vous devez renvoyer un objet JSON contenant exactement ces cl\xE9s :\n1. 'clientName': le nom complet du b\xE9n\xE9ficiaire de l'intervention (ex: 'M. Ammad').\n2. 'clientTitle': sa fonction administrative (ex: 'Chef de service').\n3. 'clientDepartment': son d\xE9partement ou service (ex: 'Ressources Humaines' ou le service d'affectation sp\xE9cifi\xE9).\n4. 'deviceType': le type d'appareil (ex: 'PC Portable', 'PC de Bureau').\n5. 'deviceBrand': la marque/mod\xE8le de l'appareil (ex: 'Dell', 'HP').\n6. 'date': la date de l'intervention au format strict 'YYYY-MM-DD'. D\xE9terminez la date d'apr\xE8s le texte (ex: 'Thursday, December 21st, 2021' ou '21 d\xE9cembre 2021' -> '2021-12-21'). S'il n'y a pas de date ou de d\xE9tails pr\xE9cis, consid\xE9rez la date : '" + currentDateStr + "'.\n7. 'rawNotes': le compte rendu technique brut \xE9crit rapidement.\n8. 'professionalSummary': un r\xE9sum\xE9 officiel poli et r\xE9dig\xE9 (1 \xE0 2 phrases) en fran\xE7ais soutenu pour le livrable.\n9. 'tasks': un tableau d'objets contenant chacun 'description' (ex: 'Installation compl\xE8te de l'OS Windows 11') et 'category' ('Mat\xE9riel', 'Logiciel', 'R\xE9seau', 'S\xE9curit\xE9', 'Optimisation', 'Autre').",
          responseMimeType: "application/json",
          responseSchema: {
            type: import_genai.Type.OBJECT,
            properties: {
              clientName: { type: import_genai.Type.STRING },
              clientTitle: { type: import_genai.Type.STRING },
              clientDepartment: { type: import_genai.Type.STRING },
              deviceType: { type: import_genai.Type.STRING },
              deviceBrand: { type: import_genai.Type.STRING },
              date: { type: import_genai.Type.STRING, description: "Format strict YYYY-MM-DD" },
              rawNotes: { type: import_genai.Type.STRING },
              professionalSummary: { type: import_genai.Type.STRING },
              tasks: {
                type: import_genai.Type.ARRAY,
                items: {
                  type: import_genai.Type.OBJECT,
                  properties: {
                    description: { type: import_genai.Type.STRING },
                    category: { type: import_genai.Type.STRING, enum: ["Mat\xE9riel", "Logiciel", "R\xE9seau", "S\xE9curit\xE9", "Optimisation", "Autre"] }
                  },
                  required: ["description", "category"]
                }
              }
            },
            required: ["clientName", "clientTitle", "clientDepartment", "deviceType", "deviceBrand", "date", "rawNotes", "professionalSummary", "tasks"]
          }
        }
      });
      const outputText = response.text;
      if (outputText) {
        res.json(JSON.parse(outputText.trim()));
        return;
      }
    } catch (error) {
      console.error("[CNIPLC API Voice] Gemini Engine Error:", error);
    }
  }
  console.log("[CNIPLC API Voice] Offline heuristic parsing fallback...");
  const lower = transcript.toLowerCase();
  let extractedName = "M. Ammad";
  let extractedDept = "Direction de l'Informatique";
  let extractedTitle = "Chef de service";
  let extractedDevice = "PC Portable";
  let extractedBrand = "Dell Latitude";
  let extractedDate = currentDateStr;
  if (lower.includes("hammad") || lower.includes("ammad")) {
    extractedName = "M. Ammad";
  }
  if (lower.includes("chef")) {
    extractedTitle = "Chef de Service";
  } else if (lower.includes("directeur")) {
    extractedTitle = "Directeur";
  }
  if (lower.includes("portable") || lower.includes("laptop") || lower.includes("pc portable")) {
    extractedDevice = "PC Portable";
  }
  if (lower.includes("windows 11")) {
    extractedBrand = "Support Windows 11";
  }
  res.json({
    clientName: extractedName,
    clientTitle: extractedTitle,
    clientDepartment: extractedDept,
    deviceType: extractedDevice,
    deviceBrand: extractedBrand,
    date: extractedDate,
    rawNotes: `Dict\xE9e vocale analys\xE9e : "${transcript}"`,
    professionalSummary: `Param\xE9trage et mise en conformit\xE9 de l'appareil ${extractedDevice} pour le compte de ${extractedName} (${extractedTitle}) rattach\xE9 au service ${extractedDept}.`,
    tasks: [
      { description: "Mise en service du syst\xE8me d'exploitation Windows 11", category: "Logiciel" },
      { description: "Mise \xE0 niveau et contr\xF4le de la m\xE9moire vive (RAM)", category: "Mat\xE9riel" }
    ]
  });
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[CNIPLC Server] Listening on http://0.0.0.0:${PORT}`);
  });
}
startServer();
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
//# sourceMappingURL=server.cjs.map
