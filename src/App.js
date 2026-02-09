import { useState } from 'react';
import './App.css';
import jsPDF from 'jspdf';


import nvi from './data/pt-br/nvi.json';
import acf from './data/pt-br/acf.json';
import aa from './data/pt-br/aa.json';

const TRANSLATIONS = {
  pt: {
    NVI: nvi,
    ACF: acf,
    AA: aa,
  }
};

const BOOK_NAMES = {
  gn: 'Gênesis',
  ex: 'Êxodo',
  lv: 'Levítico',
  nm: 'Números',
  dt: 'Deuteronômio',
  js: 'Josué',
  jz: 'Juízes',
  rt: 'Rute',
  '1sm': '1 Samuel',
  '2sm': '2 Samuel',
  '1rs': '1 Reis',
  '2rs': '2 Reis',
  '1cr': '1 Crônicas',
  '2cr': '2 Crônicas',
  ed: 'Esdras',
  ne: 'Neemias',
  et: 'Ester',
  job: 'Jó',
  sl: 'Salmos',
  pv: 'Provérbios',
  ec: 'Eclesiastes',
  ct: 'Cânticos',
  is: 'Isaías',
  jr: 'Jeremias',
  lm: 'Lamentações',
  ez: 'Ezequiel',
  dn: 'Daniel',
  os: 'Oséias',
  jl: 'Joel',
  am: 'Amós',
  ob: 'Obadias',
  jn: 'Jonas',
  mq: 'Miquéias',
  na: 'Naum',
  hc: 'Habacuque',
  sf: 'Sofonias',
  ag: 'Ageu',
  zc: 'Zacarias',
  ml: 'Malaquias',
  mt: 'Mateus',
  mc: 'Marcos',
  lc: 'Lucas',
  jo: 'João',
  at: 'Atos',
  rm: 'Romanos',
  '1co': '1 Coríntios',
  '2co': '2 Coríntios',
  gl: 'Gálatas',
  ef: 'Efésios',
  fp: 'Filipenses',
  cl: 'Colossenses',
  '1ts': '1 Tessalonicenses',
  '2ts': '2 Tessalonicenses',
  '1tm': '1 Timóteo',
  '2tm': '2 Timóteo',
  tt: 'Tito',
  fm: 'Filemom',
  hb: 'Hebreus',
  tg: 'Tiago',
  '1pe': '1 Pedro',
  '2pe': '2 Pedro',
  '1jo': '1 João',
  '2jo': '2 João',
  '3jo': '3 João',
  jd: 'Judas',
  ap: 'Apocalipse',
};

function App() {
  const [selectedLanguage, setSelectedLanguage] = useState('pt');
  const [selectedBook, setSelectedBook] = useState('');
  const [selectedTranslations, setSelectedTranslations] = useState(['NVI']);
  const [referenceStart, setReferenceStart] = useState('1:1');
  const [referenceEnd, setReferenceEnd] = useState('1:1');
  const [verses, setVerses] = useState([]);

  const parseReference = (ref) => {
    const [chapter, verse] = ref.split(':').map(n => parseInt(n) || 1);
    return { chapter, verse };
  };

  const fetchVerses = () => {
    if (!selectedBook) return;

    const start = parseReference(referenceStart);
    const end = parseReference(referenceEnd);
    const result = [];
    
    selectedTranslations.forEach(translationKey => {
      const translation = TRANSLATIONS[selectedLanguage][translationKey];
      const book = translation.find(b => b.abbrev === selectedBook);
      
      if (!book) return;

      const verseList = [];
      
      if (start.chapter === end.chapter) {
        const chapter = book.chapters[start.chapter - 1];
        for (let v = start.verse - 1; v < end.verse; v++) {
          if (chapter[v]) {
            verseList.push({
              reference: `${BOOK_NAMES[selectedBook]} ${start.chapter}:${v + 1}`,
              text: chapter[v]
            });
          }
        }
      } else {
        for (let c = start.chapter; c <= end.chapter; c++) {
          const chapter = book.chapters[c - 1];
          if (!chapter) continue;

          const isFirstChapter = c === start.chapter;
          const isLastChapter = c === end.chapter;
          
          const startVerse = isFirstChapter ? start.verse - 1 : 0;
          const endVerse = isLastChapter ? end.verse : chapter.length;

          for (let v = startVerse; v < endVerse; v++) {
            if (chapter[v]) {
              verseList.push({
                reference: `${BOOK_NAMES[selectedBook]} ${c}:${v + 1}`,
                text: chapter[v]
              });
            }
          }
        }
      }

      result.push({
        translation: translationKey,
        verses: verseList
      });
    });

    setVerses(result);
  };

  const copyToClipboard = () => {
    let text = '';
    verses.forEach(({ translation, verses: verseList }) => {
      text += `${translation}\n`;
      verseList.forEach(v => {
        text += `${v.reference} - ${v.text}\n`;
      });
      text += '\n';
    });
    navigator.clipboard.writeText(text);
    alert('Versículos copiados!');
  };

const exportToTXT = () => {
  let text = '';
  
  verses.forEach(({ translation, verses: verseList }) => {
    text += `${translation}\n`;
    text += '='.repeat(50) + '\n\n';
    
    verseList.forEach(v => {
      text += `${v.reference}\n${v.text}\n\n`;
    });
    
    text += '\n';
  });
  
  // Cria blob
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  
  // Download
  const a = document.createElement('a');
  a.href = url;
  a.download = `versiculos-${selectedBook || 'biblia'}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const exportToPDF = () => {
  const doc = new jsPDF();
  
  let yPosition = 20;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  const lineHeight = 7;
  const maxWidth = 170;
  
  verses.forEach(({ translation, verses: verseList }, translationIndex) => {
    // Título da tradução
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    
    // Verifica se precisa nova página
    if (yPosition + 20 > pageHeight - margin) {
      doc.addPage();
      yPosition = 20;
    }
    
    doc.text(translation, margin, yPosition);
    yPosition += 10;
    
    // Linha separadora
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, margin + maxWidth, yPosition);
    yPosition += 8;
    
    // Versículos
    doc.setFontSize(10);
    
    verseList.forEach(verse => {
      // Referência (negrito)
      doc.setFont(undefined, 'bold');
      
      // Verifica espaço
      if (yPosition + lineHeight > pageHeight - margin) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.text(verse.reference, margin, yPosition);
      yPosition += lineHeight;
      
      // Texto do versículo (normal)
      doc.setFont(undefined, 'normal');
      
      // Quebra texto em múltiplas linhas
      const lines = doc.splitTextToSize(verse.text, maxWidth);
      
      lines.forEach(line => {
        // Verifica espaço
        if (yPosition + lineHeight > pageHeight - margin) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.text(line, margin, yPosition);
        yPosition += lineHeight;
      });
       // Espaço entre versículos
      yPosition += 3;
    });
    // Espaço entre traduções
    yPosition += 10; 
  });
  
  // Download
  doc.save(`versiculos-${selectedBook || 'biblia'}.pdf`);
};

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Transcrito
          </h1>
          <p className="text-gray-600">
            Copie versículos da Bíblia de forma simples
          </p>
        </div>
        
        {/* Main Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          
          {/* Livro */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              1. Escolha o livro
            </label>
            <select 
              value={selectedBook}
              onChange={(e) => setSelectedBook(e.target.value)}
              className="w-full border-2 border-gray-300 rounded-lg p-3 text-lg focus:border-blue-500 focus:outline-none"
            >
              <option value="">-- Selecione --</option>
              {Object.entries(BOOK_NAMES).map(([abbrev, name]) => (
                <option key={abbrev} value={abbrev}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          {/* Intervalo */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              2. Defina o intervalo
            </label>
            <div className="flex items-center gap-3">
              <input 
                type="text"
                placeholder="Ex: 1:1"
                value={referenceStart}
                onChange={(e) => setReferenceStart(e.target.value)}
                className="flex-1 border-2 border-gray-300 rounded-lg p-3 text-lg focus:border-blue-500 focus:outline-none"
              />
              <span className="text-gray-500 font-semibold">até</span>
              <input 
                type="text"
                placeholder="Ex: 1:10"
                value={referenceEnd}
                onChange={(e) => setReferenceEnd(e.target.value)}
                className="flex-1 border-2 border-gray-300 rounded-lg p-3 text-lg focus:border-blue-500 focus:outline-none"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Formato: capítulo:versículo (ex: 23:1 até 23:6)
            </p>
          </div>

          {/* Traduções */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              3. Escolha as traduções (até 4)
            </label>
            <div className="flex flex-wrap gap-3">
              {Object.keys(TRANSLATIONS[selectedLanguage]).map(key => (
                <label 
                  key={key}
                  className={`flex items-center px-4 py-2 rounded-lg border-2 cursor-pointer transition ${
                    selectedTranslations.includes(key)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input 
                    type="checkbox"
                    checked={selectedTranslations.includes(key)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        if (selectedTranslations.length < 4) {
                          setSelectedTranslations([...selectedTranslations, key]);
                        }
                      } else {
                        setSelectedTranslations(selectedTranslations.filter(t => t !== key));
                      }
                    }}
                    className="mr-2"
                  />
                  <span className="font-medium">{key}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Botão */}
          <button 
            onClick={fetchVerses}
            disabled={!selectedBook}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold text-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
          >
            Buscar Versículos
          </button>
        </div>

        {/* Resultado */}
{verses.length > 0 && (
  <div className="bg-white rounded-lg shadow-md p-6">
    <div className="flex justify-between items-center mb-4">
  <h2 className="text-xl font-bold text-gray-900">Resultado</h2>
  <div className="flex gap-2">
    <button
      onClick={exportToTXT}
      className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
    >
      📄 TXT
    </button>
    <button
      onClick={exportToPDF}
      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
    >
      📕 PDF
    </button>
    <button
      onClick={copyToClipboard}
      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
    >
      📋 Copiar
    </button>
  </div>
</div>
    
    <div className={`grid gap-6 ${
      selectedTranslations.length === 1 ? 'grid-cols-1' :
      selectedTranslations.length === 2 ? 'md:grid-cols-2' :
      selectedTranslations.length === 3 ? 'md:grid-cols-3' :
      'md:grid-cols-2 lg:grid-cols-4'
    }`}>
      {verses.map(({ translation, verses: verseList }) => (
        <div key={translation} className="border-l-4 border-blue-500 pl-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-lg text-blue-700">{translation}</h3>
            <button
              onClick={() => {
                let text = `${translation}\n`;
                verseList.forEach(v => {
                  text += `${v.reference} - ${v.text}\n`;
                });
                navigator.clipboard.writeText(text);
                alert(`${translation} copiado!`);
              }}
              className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 transition"
            >
              📋
            </button>
          </div>
          <div className="space-y-3">
            {verseList.map((verse, idx) => (
              <div key={idx} className="text-gray-700">
                <span className="font-semibold text-sm text-gray-500">
                  {verse.reference}
                </span>
                <p className="mt-1">{verse.text}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
)}
      </div>
    </div>
  );
}

export default App;