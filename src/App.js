import { useState } from 'react';
import './App.css';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { Tooltip } from 'react-tooltip';

import nvi from './data/pt-br/nvi.json';
import acf from './data/pt-br/acf.json';
import aa from './data/pt-br/aa.json';

// Configura fontes para pdfMake
// Configura fontes para pdfMake (compatibilidade com diferentes builds)
const vfsSource = pdfFonts && (pdfFonts.pdfMake ? pdfFonts.pdfMake.vfs : pdfFonts.vfs);
if (vfsSource) {
  pdfMake.vfs = vfsSource;
}

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
  
  // Display settings
  const [displaySettings, setDisplaySettings] = useState({
  fontSize: 16,
  lineHeight: 1.6,
  textAlign: 'left',
  verseNumberFormat: 'number',
  layout: 'columns',
  textFlow: 'paragraph',
  pdfMode: 'optimized' // 'optimized' ou 'custom'
});

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
              text: chapter[v],
              chapter: start.chapter,
              verse: v + 1
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
                text: chapter[v],
                chapter: c,
                verse: v + 1
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

  // Função auxiliar para formatar verso com base nas configurações de exibição
  // Converte número para superscript Unicode
  const toSuperscript = (num) => {
    const superscriptMap = {
      '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
      '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹'
    };
    return num.toString().split('').map(digit => superscriptMap[digit] || digit).join('');
  };

  const formatVerseText = (verse) => {
    let result = '';
    
    if (displaySettings.verseNumberFormat === 'full') {
      result += verse.reference + '\n';
    } else if (displaySettings.verseNumberFormat === 'number') {
      result += toSuperscript(verse.verse) + ' ';
    }
    
    result += verse.text;
    return result;
  };

  // Função auxiliar para gerar texto com fluxo e capítulos configuráveis
  const generateVerseListText = (verseList, separator = '\n', includeChapters = true) => {
    const hasMultipleChapters = verseList.length > 0 && 
      verseList[0].chapter !== verseList[verseList.length - 1].chapter;
    
    let result = [];
    let currentChapter = null;
    
    verseList.forEach((verse, idx) => {
      const isNewChapter = verse.chapter !== currentChapter;
      
      // Adiciona cabeçalho de capítulo se necessário
      if (includeChapters && hasMultipleChapters && isNewChapter) {
        // Adiciona quebra antes do novo capítulo (exceto no primeiro)
        if (currentChapter !== null) {
          result.push('\n');
        }
        
        result.push(`${BOOK_NAMES[selectedBook]} ${verse.chapter}`);
        result.push('---\n');
        currentChapter = verse.chapter;
      }
      
      if (displaySettings.textFlow === 'continuous') {
        // Texto corrido
        if (displaySettings.verseNumberFormat === 'full') {
          result.push(`${verse.reference} ${verse.text}`);
        } else if (displaySettings.verseNumberFormat === 'number') {
          result.push(`${toSuperscript(verse.verse)} ${verse.text}`);
        } else {
          result.push(verse.text);
        }
      } else {
        // Verso por verso
        result.push(formatVerseText(verse));
      }
    });
    
    return displaySettings.textFlow === 'continuous' 
      ? result.join(' ')
      : result.join(separator);
  };

  // Função para gerar conteúdo em formato paralelo
  const generateParallelText = () => {
    let text = '';
    const firstVerseList = verses[0].verses;
    const hasMultipleChapters = firstVerseList.length > 0 && 
      firstVerseList[0].chapter !== firstVerseList[firstVerseList.length - 1].chapter;
    
    // Cabeçalhos das traduções
    text += verses.map(v => v.translation).join(' | ') + '\n';
    text += Array(verses.length).fill('---').join(' | ') + '\n\n';
    
    let currentChapter = null;
    
    // Versículos linha por linha
    firstVerseList.forEach((verse, idx) => {
      const isNewChapter = verse.chapter !== currentChapter;
      
      if (hasMultipleChapters && isNewChapter) {
        if (currentChapter !== null) {
          text += '\n';
        }
        text += `${BOOK_NAMES[selectedBook]} ${verse.chapter}\n`;
        text += '='.repeat(80) + '\n\n';
        currentChapter = verse.chapter;
      }
      
      // Monta linha com versículos de todas as traduções
      const line = verses.map(({ verses: verseList }) => {
        const currentVerse = verseList[idx];
        let verseText = '';
        
        if (displaySettings.verseNumberFormat === 'full') {
          verseText += currentVerse.reference + ' - ';
        } else if (displaySettings.verseNumberFormat === 'number') {
          verseText += `${toSuperscript(currentVerse.verse)} `;
        }
        
        verseText += currentVerse.text;
        return verseText;
      }).join(' | ');
      
      text += line + '\n\n';
    });
    
    return text;
  };

  const copyToClipboard = () => {
    let text = '';
    
    if (displaySettings.layout === 'parallel') {
      text = generateParallelText();
    } else {
      verses.forEach(({ translation, verses: verseList }) => {
        text += `${translation}\n`;
        text += '='.repeat(50) + '\n\n';
        text += generateVerseListText(verseList, '\n', true);
        text += '\n\n';
      });
    }
    
    navigator.clipboard.writeText(text);
    alert('Versículos copiados!');
  };

  const exportToTXT = () => {
    let text = '';
    
    if (displaySettings.layout === 'parallel') {
      text = generateParallelText();
    } else {
      verses.forEach(({ translation, verses: verseList }) => {
        text += `${translation}\n`;
        text += '='.repeat(50) + '\n\n';
        text += generateVerseListText(verseList, '\n\n', true);
        text += '\n\n';
      });
    }
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `versiculos-${selectedBook || 'biblia'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Formata verso para PDF (sem Unicode problemático)
  const formatVerseForPDF = (verse) => {
    let result = '';

    if (displaySettings.verseNumberFormat === 'full') {
      result += verse.reference + '\n';
    } else if (displaySettings.verseNumberFormat === 'number') {
      result += verse.verse + ' ';
    }

    result += verse.text;
    return result;
  };

  const exportToPDF = () => {
    const pdfFontSize = displaySettings.pdfMode === 'optimized' ? 11 : displaySettings.fontSize * 0.75;
    const pdfLineHeight = displaySettings.pdfMode === 'optimized' ? 1.3 : displaySettings.lineHeight;
    
    let docDefinition = {
      content: [],
      defaultStyle: {
        fontSize: pdfFontSize,
        lineHeight: pdfLineHeight,
        alignment: displaySettings.pdfMode === 'optimized' ? 'left' : displaySettings.textAlign
      },
      pageMargins: [40, 40, 40, 40]
    };
    
    if (displaySettings.layout === 'parallel') {
      // Layout paralelo
      const firstVerseList = verses[0].verses;
      const hasMultipleChapters = firstVerseList.length > 0 && 
        firstVerseList[0].chapter !== firstVerseList[firstVerseList.length - 1].chapter;
      
      // Cabeçalhos das traduções
      const headers = verses.map(v => ({
        text: v.translation,
        bold: true,
        fontSize: 12,
        alignment: 'center'
      }));
      
      docDefinition.content.push({
        columns: headers,
        columnGap: 10,
        margin: [0, 0, 0, 10]
      });
      
      let currentChapter = null;
      
      // Versículos linha por linha
      firstVerseList.forEach((verse, idx) => {
        const isNewChapter = verse.chapter !== currentChapter;
        
        if (hasMultipleChapters && isNewChapter) {
          if (currentChapter !== null) {
            docDefinition.content.push({ text: '', margin: [0, 5, 0, 5] });
          }
          
          docDefinition.content.push({
            text: `${BOOK_NAMES[selectedBook]} ${verse.chapter}`,
            bold: true,
            fontSize: 12,
            alignment: 'center',
            margin: [0, 10, 0, 5]
          });
          
          currentChapter = verse.chapter;
        }
        
        // Monta colunas com versículos
        const verseColumns = verses.map(({ verses: verseList }) => {
          const currentVerse = verseList[idx];
          let verseContent = [];
          
          if (displaySettings.verseNumberFormat === 'full') {
            verseContent.push({ text: currentVerse.reference + ' ', bold: true, fontSize: pdfFontSize * 0.9 });
          } else if (displaySettings.verseNumberFormat === 'number') {
            verseContent.push({ text: currentVerse.verse.toString(), fontSize: pdfFontSize * 0.7, superscript: true });
            verseContent.push({ text: ' ' });
          }
          
          verseContent.push({ text: currentVerse.text });
          
          return { text: verseContent };
        });
        
        docDefinition.content.push({
          columns: verseColumns,
          columnGap: 10,
          margin: [0, 3, 0, 3]
        });
      });
    } else {
      // Layout de colunas
      verses.forEach(({ translation, verses: verseList }, transIdx) => {
        if (transIdx > 0) {
          docDefinition.content.push({ text: '', pageBreak: 'before' });
        }
        
        // Título da tradução
        docDefinition.content.push({
          text: translation,
          bold: true,
          fontSize: 14,
          margin: [0, 0, 0, 5]
        });
        
        docDefinition.content.push({
          canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1 }],
          margin: [0, 0, 0, 10]
        });
        
        const hasMultipleChapters = verseList.length > 0 && 
          verseList[0].chapter !== verseList[verseList.length - 1].chapter;
        
        let currentChapter = null;
        
        if (displaySettings.textFlow === 'continuous') {
          // Texto corrido
          let paragraphContent = [];
          
          verseList.forEach((verse) => {
            const isNewChapter = verse.chapter !== currentChapter;
            
            if (hasMultipleChapters && isNewChapter) {
              // Finaliza parágrafo anterior
              if (paragraphContent.length > 0) {
                docDefinition.content.push({
                  text: paragraphContent,
                  margin: [0, 0, 0, 5]
                });
                paragraphContent = [];
              }
              
              // Adiciona cabeçalho de capítulo
              docDefinition.content.push({
                text: `${BOOK_NAMES[selectedBook]} ${verse.chapter}`,
                bold: true,
                fontSize: 12,
                margin: [0, 10, 0, 5]
              });
              
              currentChapter = verse.chapter;
            }
            
            // Adiciona versículo ao parágrafo
            if (displaySettings.verseNumberFormat === 'full') {
              paragraphContent.push({ text: verse.reference + ' ', bold: true, fontSize: pdfFontSize * 0.9 });
            } else if (displaySettings.verseNumberFormat === 'number') {
              paragraphContent.push({ text: verse.verse.toString(), fontSize: pdfFontSize * 0.7, superscript: true });
              paragraphContent.push({ text: ' ' });
            }
            
            paragraphContent.push({ text: verse.text + ' ' });
          });
          
          // Adiciona último parágrafo
          if (paragraphContent.length > 0) {
            docDefinition.content.push({
              text: paragraphContent,
              margin: [0, 0, 0, 5]
            });
          }
        } else {
          // Verso por verso
          verseList.forEach((verse) => {
            const isNewChapter = verse.chapter !== currentChapter;
            
            if (hasMultipleChapters && isNewChapter) {
              docDefinition.content.push({
                text: `${BOOK_NAMES[selectedBook]} ${verse.chapter}`,
                bold: true,
                fontSize: 12,
                margin: [0, 10, 0, 5]
              });
              
              currentChapter = verse.chapter;
            }
            
            let verseContent = [];
            
            if (displaySettings.verseNumberFormat === 'full') {
              verseContent.push({ text: verse.reference, bold: true, fontSize: pdfFontSize * 0.9 });
              verseContent.push({ text: '\n' });
            } else if (displaySettings.verseNumberFormat === 'number') {
              verseContent.push({ text: verse.verse.toString(), fontSize: pdfFontSize * 0.7, superscript: true });
              verseContent.push({ text: ' ' });
            }
            
            verseContent.push({ text: verse.text });
            
            docDefinition.content.push({
              text: verseContent,
              margin: [0, 0, 0, 5]
            });
          });
        }
      });
    }
    
    pdfMake.createPdf(docDefinition).download(`versiculos-${selectedBook || 'biblia'}.pdf`);
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
            {/* Configurações de Exibição */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Configurações de Exibição
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                
                {/* Tamanho da Fonte */}
                <div>
                  <label className="block text-xs text-gray-600 mb-2">
                    Tamanho da fonte
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setDisplaySettings({
                        ...displaySettings,
                        fontSize: Math.max(12, displaySettings.fontSize - 2)
                      })}
                      className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-lg font-bold"
                    >
                      -
                    </button>
                    <span className="text-sm font-medium w-12 text-center">
                      {displaySettings.fontSize}px
                    </span>
                    <button
                      onClick={() => setDisplaySettings({
                        ...displaySettings,
                        fontSize: Math.min(28, displaySettings.fontSize + 2)
                      })}
                      className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-lg font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
                
                {/* Espaçamento da Linha */}
                <div>
                  <label className="block text-xs text-gray-600 mb-2">
                    Espaçamento
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setDisplaySettings({
                        ...displaySettings,
                        lineHeight: Math.max(1.2, displaySettings.lineHeight - 0.2)
                      })}
                      className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-lg font-bold"
                    >
                      -
                    </button>
                    <span className="text-sm font-medium w-12 text-center">
                      {displaySettings.lineHeight.toFixed(1)}
                    </span>
                    <button
                      onClick={() => setDisplaySettings({
                        ...displaySettings,
                        lineHeight: Math.min(2.5, displaySettings.lineHeight + 0.2)
                      })}
                      className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-lg font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
                
                {/* Alinhamento */}
                <div>
                  <label className="block text-xs text-gray-600 mb-2">
                    Alinhamento
                  </label>
                  <select
                    value={displaySettings.textAlign}
                    onChange={(e) => setDisplaySettings({
                      ...displaySettings,
                      textAlign: e.target.value
                    })}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                  >
                    <option value="left">Esquerda</option>
                    <option value="center">Centro</option>
                    <option value="justify">Justificado</option>
                  </select>
                </div>

                
		
		{/* Layout */}
<div>
  <label className="block text-xs text-gray-600 mb-2">
    Layout
  </label>
  <div 
    data-tooltip-id="layout-tooltip"
    data-tooltip-content={
      displaySettings.layout === 'columns'
        ? 'Ideal para visualizar múltiplas traduções lado a lado em colunas.'
        : 'Ideal para comparar versículos linha por linha de múltiplas traduções.'
    }
    className="relative"
  >
    <select
      value={displaySettings.layout}
      onChange={(e) => setDisplaySettings({
        ...displaySettings,
        layout: e.target.value
      })}
      className="w-full border border-gray-300 rounded px-2 py-1 text-sm cursor-help"
    >
      <option value="columns">Colunas</option>
      <option value="parallel">Linhas Paralelas</option>
    </select>
  </div>
  <Tooltip id="layout-tooltip" className="text-xs" style={{backgroundColor: '#374151', color: '#fff'}} />
</div>

{/* Fluxo do Texto*/}
<div>
  <label className="block text-xs text-gray-600 mb-2">
    Fluxo do texto
    {displaySettings.layout === 'parallel' && (
      <span className="text-xs text-gray-400 ml-1">(somente no layout Colunas)</span>
    )}
  </label>
  <select
    value={displaySettings.textFlow}
    onChange={(e) => setDisplaySettings({
      ...displaySettings,
      textFlow: e.target.value
    })}
    disabled={displaySettings.layout === 'parallel'}
    className={`w-full border border-gray-300 rounded px-2 py-1 text-sm ${
      displaySettings.layout === 'parallel' 
        ? 'bg-gray-100 cursor-not-allowed opacity-60' 
        : ''
    }`}
  >
    <option value="paragraph">Linha por linha</option>
    <option value="continuous">Texto corrido</option>
  </select>
</div>
                
                {/* Mostrar Números */}
                <div>
  <label className="block text-xs text-gray-600 mb-2">
    Referência
  </label>
  <select
    value={displaySettings.verseNumberFormat}
    onChange={(e) => setDisplaySettings({
      ...displaySettings,
      verseNumberFormat: e.target.value
    })}
    className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
  >
    <option value="full">Completa (João 3:16)</option>
    <option value="number">Número (¹⁶)</option>
    <option value="none">Ocultar</option>
  </select>
</div>

{/* Modo PDF */}
<div>
  <label className="block text-xs text-gray-600 mb-2">
    Modo PDF
  </label>
  <select
    value={displaySettings.pdfMode}
    onChange={(e) => setDisplaySettings({
      ...displaySettings,
      pdfMode: e.target.value
    })}
    className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
  >
    <option value="optimized">Otimizado (padrão)</option>
    <option value="custom">Usar configurações de exibição</option>
  </select>
  <p className="text-xs text-gray-500 mt-1">
    {displaySettings.pdfMode === 'optimized'
      ? 'PDF com tamanho e espaçamento otimizados'
      : 'PDF respeitando suas configurações de exibição'}
  </p>
</div>
                
              </div>
            </div>

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
    
{/* LAYOUT: COLUNAS */}
{displaySettings.layout === 'columns' && (
  <div className={`grid gap-6 ${
    verses.length === 1 ? 'grid-cols-1' :
    verses.length === 2 ? 'md:grid-cols-2' :
    verses.length === 3 ? 'md:grid-cols-3' :
    'md:grid-cols-2 lg:grid-cols-4'
  }`}>
    {verses.map(({ translation, verses: verseList }) => {
      const hasMultipleChapters = verseList.length > 0 && 
        verseList[0].chapter !== verseList[verseList.length - 1].chapter;
      
      return (
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
          
          <div 
            style={{
              fontSize: `${displaySettings.fontSize}px`,
              lineHeight: displaySettings.lineHeight,
              textAlign: displaySettings.textAlign
            }}
          >
            {/* FLUXO: LINHA POR LINHA */}
            {displaySettings.textFlow === 'paragraph' && (
              <div className="space-y-3">
                {verseList.map((verse, idx) => {
                  const isNewChapter = idx === 0 || verse.chapter !== verseList[idx - 1].chapter;
                  
                  return (
                    <div key={idx} className="text-gray-700">
                      {hasMultipleChapters && isNewChapter && (
                        <h4 className="font-bold text-gray-800 mb-3 text-center">
                          {BOOK_NAMES[selectedBook]} {verse.chapter}
                        </h4>
                      )}
                      
                      {displaySettings.verseNumberFormat === 'full' && (
                        <span className="font-semibold text-sm text-gray-500 block mb-1">
                          {verse.reference}
                        </span>
                      )}
                      
                      <p>
                        {displaySettings.verseNumberFormat === 'number' && (
                          <sup className="text-gray-500 mr-1 font-semibold">
                            {verse.verse}
                          </sup>
                        )}
                        {verse.text}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* FLUXO: TEXTO CORRIDO */}
            {displaySettings.textFlow === 'continuous' && (
              <div className="text-gray-700">
                {verseList.map((verse, idx) => {
                  const isNewChapter = idx === 0 || verse.chapter !== verseList[idx - 1].chapter;
                  
                  return (
                    <span key={idx}>
                      {/* Cabeçalho de capítulo */}
                      {hasMultipleChapters && isNewChapter && (
                        <h4 className="font-bold text-gray-800 mt-4 mb-2 block">
                          {BOOK_NAMES[selectedBook]} {verse.chapter}
                        </h4>
                      )}
                      
                      {/* Referência completa (se formato full) */}
                      {displaySettings.verseNumberFormat === 'full' && (
                        <span className="font-semibold text-sm text-gray-500">
                          {verse.reference}{' '}
                        </span>
                      )}
                      
                      {/* Número do verso (se formato number) */}
                      {displaySettings.verseNumberFormat === 'number' && (
                        <sup className="text-gray-500 mr-1 font-semibold">
                          {verse.verse}
                        </sup>
                      )}
                      
                      {/* Texto do versículo */}
                      {verse.text}{' '}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      );
    })}
  </div>
)}

{/* LAYOUT: LINHAS PARALELAS */}
{displaySettings.layout === 'parallel' && verses.length > 0 && (
  <div>
    {/* Cabeçalhos das traduções */}
    <div className={`grid gap-4 mb-4 ${
      verses.length === 1 ? 'grid-cols-1' :
      verses.length === 2 ? 'grid-cols-2' :
      verses.length === 3 ? 'grid-cols-3' :
      'grid-cols-4'
    }`}>
      {verses.map(({ translation }) => (
        <div key={translation} className="font-bold text-lg text-blue-700 text-center border-b-2 border-blue-500 pb-2">
          {translation}
        </div>
      ))}
    </div>
    
    {/* Versículos linha por linha */}
    <div className="space-y-4">
      {verses[0].verses.map((_, verseIdx) => {
        const verse = verses[0].verses[verseIdx];
        const isNewChapter = verseIdx === 0 || 
          verse.chapter !== verses[0].verses[verseIdx - 1].chapter;
        
        return (
          <div key={verseIdx}>
            {/* Cabeçalho de capítulo (se múltiplos capítulos) */}
            {isNewChapter && verses[0].verses.length > 1 && 
             verses[0].verses[0].chapter !== verses[0].verses[verses[0].verses.length - 1].chapter && (
              <h4 className="font-bold text-gray-800 mb-3 text-center">
                {BOOK_NAMES[selectedBook]} {verse.chapter}
              </h4>
            )}
            
            {/* Grid com versículos alinhados */}
            <div 
              className={`grid gap-4 items-start ${
                verses.length === 1 ? 'grid-cols-1' :
                verses.length === 2 ? 'grid-cols-2' :
                verses.length === 3 ? 'grid-cols-3' :
                'grid-cols-4'
              }`}
              style={{
                fontSize: `${displaySettings.fontSize}px`,
                lineHeight: displaySettings.lineHeight,
                textAlign: displaySettings.textAlign
              }}
            >
              {verses.map(({ translation, verses: verseList }) => {
                const currentVerse = verseList[verseIdx];
                
                return (
                  <div key={translation} className="p-3 bg-gray-50 rounded border border-gray-200">
                    {/* FLUXO: LINHA POR LINHA */}
                    {displaySettings.textFlow === 'paragraph' && (
                      <>
                        {displaySettings.verseNumberFormat === 'full' && (
                          <span className="font-semibold text-xs text-gray-500 block mb-1">
                            {currentVerse.reference}
                          </span>
                        )}
                        
                        <p className="text-gray-700">
                          {displaySettings.verseNumberFormat === 'number' && (
                            <sup className="text-gray-500 mr-1 font-semibold">
                              {currentVerse.verse}
                            </sup>
                          )}
                          {currentVerse.text}
                        </p>
                      </>
                    )}
                    
                    {/* FLUXO: TEXTO CORRIDO */}
                    {displaySettings.textFlow === 'continuous' && (
                      <p className="text-gray-700">
                        {displaySettings.verseNumberFormat === 'full' && (
                          <span className="font-semibold text-xs text-gray-500">
                            {currentVerse.reference}{' '}
                          </span>
                        )}
                        {displaySettings.verseNumberFormat === 'number' && (
                          <sup className="text-gray-500 mr-1 font-semibold">
                            {currentVerse.verse}
                          </sup>
                        )}
                        {currentVerse.text}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  </div>
)}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;