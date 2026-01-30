/**
 * MacroMatrix Demo Page
 *
 * Demonstrates the 15-second SOAP note capability with bilingual support.
 */

import React, { useState } from 'react';
import { Globe, FileText, Zap, Clock, Copy, Trash2 } from 'lucide-react';
import MacroMatrix, { MacroMatrixInline } from '../components/assessment/MacroMatrix';

export default function MacroMatrixDemo() {
  const [lang, setLang] = useState('no');
  const [noteContent, setNoteContent] = useState('');
  const [favorites, setFavorites] = useState([]);
  const [insertCount, setInsertCount] = useState(0);

  const handleInsert = (text, field) => {
    setNoteContent(prev => prev ? `${prev}\n\n${text}` : text);
    setInsertCount(prev => prev + 1);
  };

  const handleClear = () => {
    setNoteContent('');
    setInsertCount(0);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(noteContent);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Zap className="w-6 h-6 text-amber-500" />
                {lang === 'no' ? 'MacroMatrix Demo' : 'MacroMatrix Demo'}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {lang === 'no'
                  ? '15-sekunders SOAP-notat med makroer'
                  : '15-second SOAP notes with macros'}
              </p>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg">
                <FileText className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">
                  {insertCount} {lang === 'no' ? 'innsettinger' : 'inserts'}
                </span>
              </div>

              {/* Language Toggle */}
              <button
                onClick={() => setLang(lang === 'no' ? 'en' : 'no')}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200
                          rounded-lg transition-colors"
              >
                <Globe className="w-4 h-4" />
                <span className="font-medium">{lang === 'no' ? 'Norsk' : 'English'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* MacroMatrix Panel */}
          <div>
            <MacroMatrix
              onInsert={handleInsert}
              lang={lang}
              favorites={favorites}
              onFavoritesChange={setFavorites}
            />

            {/* Inline Demo */}
            <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-800 mb-3">
                {lang === 'no' ? 'Inline Makroer' : 'Inline Macros'}
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 mb-2">
                    {lang === 'no' ? 'Justeringer' : 'Adjustments'}
                  </p>
                  <MacroMatrixInline
                    onInsert={(text) => handleInsert(text, 'current')}
                    category="adjustments"
                    maxItems={6}
                    lang={lang}
                  />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-2">
                    {lang === 'no' ? 'Behandlinger' : 'Therapies'}
                  </p>
                  <MacroMatrixInline
                    onInsert={(text) => handleInsert(text, 'current')}
                    category="therapies"
                    maxItems={6}
                    lang={lang}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Note Preview Panel */}
          <div className="lg:sticky lg:top-24 h-fit">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  {lang === 'no' ? 'Generert Notat' : 'Generated Note'}
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    disabled={!noteContent}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {lang === 'no' ? 'Kopier' : 'Copy'}
                  </button>
                  <button
                    onClick={handleClear}
                    disabled={!noteContent}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 text-gray-700 disabled:text-gray-400 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {lang === 'no' ? 'Tøm' : 'Clear'}
                  </button>
                </div>
              </div>

              <div className="p-4 min-h-[400px]">
                {noteContent ? (
                  <div className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
                    {noteContent}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[400px] text-center text-gray-400">
                    <FileText className="w-12 h-12 mb-3 opacity-50" />
                    <p className="text-sm">
                      {lang === 'no'
                        ? 'Klikk på makroer for å bygge notatet'
                        : 'Click on macros to build your note'}
                    </p>
                    <p className="text-xs mt-2">
                      {lang === 'no'
                        ? 'Prøv "15-Sek Modus" for raskere dokumentasjon'
                        : 'Try "15-Sec Mode" for faster documentation'}
                    </p>
                  </div>
                )}
              </div>

              {noteContent && (
                <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    {noteContent.length} {lang === 'no' ? 'tegn' : 'characters'} | {noteContent.split(/\s+/).filter(Boolean).length} {lang === 'no' ? 'ord' : 'words'}
                  </p>
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="mt-4 bg-amber-50 rounded-lg border border-amber-200 p-4">
              <h4 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {lang === 'no' ? 'Hurtigguide' : 'Quick Guide'}
              </h4>
              <ul className="text-sm text-amber-700 space-y-1">
                <li>
                  {lang === 'no'
                    ? '• Klikk "15-Sek Modus" for guidet SOAP-bygging'
                    : '• Click "15-Sec Mode" for guided SOAP building'}
                </li>
                <li>
                  {lang === 'no'
                    ? '• Bruk tall 1-8 på tastaturet for å bytte kategori'
                    : '• Use number keys 1-8 to switch categories'}
                </li>
                <li>
                  {lang === 'no'
                    ? '• Hold musepekeren over makroer for å se full tekst'
                    : '• Hover over macros to see full text'}
                </li>
                <li>
                  {lang === 'no'
                    ? '• Klikk stjerne for å legge til favoritter'
                    : '• Click star to add favorites'}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
