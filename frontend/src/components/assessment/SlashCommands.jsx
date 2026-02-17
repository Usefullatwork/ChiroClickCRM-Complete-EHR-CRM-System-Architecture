import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Command, ChevronRight, _X } from 'lucide-react';

/**
 * SlashCommands - Jane App-style text expansion system
 *
 * Type a shortcut like /plan or /normal and it auto-expands into full text.
 * This is similar to Notion's slash commands or Jane App's "Phrases" feature.
 *
 * Features:
 * - Type "/" to trigger command palette
 * - Fuzzy search across commands
 * - Custom user commands
 * - Keyboard navigation
 * - Context-aware suggestions
 */

// Default slash commands organized by category
const DEFAULT_COMMANDS = {
  // Subjective shortcuts
  '/better': {
    category: 'Subjective',
    label: 'Patient Better',
    text: 'Patient reports improvement in symptoms since the last visit.',
    aliases: ['/improved', '/improving'],
  },
  '/same': {
    category: 'Subjective',
    label: 'No Change',
    text: 'Patient reports no significant change in symptoms since the last visit.',
    aliases: ['/nochange', '/unchanged'],
  },
  '/worse': {
    category: 'Subjective',
    label: 'Patient Worse',
    text: 'Patient reports worsening of symptoms since the last visit.',
    aliases: ['/worsening'],
  },
  '/50better': {
    category: 'Subjective',
    label: '50% Improvement',
    text: 'Patient reports approximately 50% improvement in symptoms since the last visit.',
    aliases: ['/50', '/halfbetter'],
  },
  '/75better': {
    category: 'Subjective',
    label: '75% Improvement',
    text: 'Patient reports approximately 75% improvement in symptoms since the last visit.',
    aliases: ['/75'],
  },
  '/25better': {
    category: 'Subjective',
    label: '25% Improvement',
    text: 'Patient reports approximately 25% improvement in symptoms since the last visit.',
    aliases: ['/25'],
  },
  '/newcomplaint': {
    category: 'Subjective',
    label: 'New Complaint',
    text: 'Patient presents with a new complaint in addition to the ongoing condition being treated.',
    aliases: ['/new', '/nc'],
  },
  '/compliant': {
    category: 'Subjective',
    label: 'Compliant with HEP',
    text: 'Patient reports compliance with home exercise program and treatment recommendations.',
    aliases: ['/hep'],
  },

  // Objective shortcuts
  '/normal': {
    category: 'Objective',
    label: 'Normal Exam',
    text: 'All orthopedic and neurological tests were within normal limits.',
    aliases: ['/wnl', '/neg'],
  },
  '/neuro': {
    category: 'Objective',
    label: 'Neuro Intact',
    text: 'Neurological examination: Deep tendon reflexes 2+ and symmetric bilaterally. Dermatomal sensation intact. Myotomal strength 5/5 throughout. No pathological reflexes noted.',
    aliases: ['/neurointact', '/dtrs'],
  },
  '/spasm': {
    category: 'Objective',
    label: 'Muscle Spasm',
    text: 'Palpation revealed significant muscle spasm and hypertonicity in the paraspinal musculature.',
    aliases: ['/hypertonicity'],
  },
  '/sublux': {
    category: 'Objective',
    label: 'Subluxation Found',
    text: 'Palpation revealed vertebral subluxation with associated segmental joint dysfunction, point tenderness, muscle hypertonicity, and capsular swelling.',
    aliases: ['/subluxation', '/vsc'],
  },
  '/restricted': {
    category: 'Objective',
    label: 'Restricted ROM',
    text: 'Range of motion testing revealed restriction with pain noted at end range.',
    aliases: ['/rom'],
  },
  '/trigger': {
    category: 'Objective',
    label: 'Trigger Points',
    text: 'Multiple trigger points identified in the affected musculature with characteristic referred pain pattern.',
    aliases: ['/tp', '/triggers'],
  },
  '/posture': {
    category: 'Objective',
    label: 'Postural Analysis',
    text: 'Postural analysis revealed deviation from normal alignment with compensatory changes noted throughout the kinetic chain.',
    aliases: ['/postural'],
  },
  '/gait': {
    category: 'Objective',
    label: 'Gait Normal',
    text: 'Gait analysis revealed normal ambulation pattern without antalgic deviation.',
    aliases: ['/gaitnormal'],
  },

  // Assessment shortcuts
  '/msk': {
    category: 'Assessment',
    label: 'Mechanical MSK',
    text: 'Clinical presentation consistent with mechanical musculoskeletal dysfunction. Responding well to conservative chiropractic care.',
    aliases: ['/mechanical'],
  },
  '/radicular': {
    category: 'Assessment',
    label: 'Radiculopathy',
    text: 'Clinical presentation consistent with radiculopathy with positive nerve tension signs and dermatomal findings. Monitor for progression.',
    aliases: ['/radiculopathy'],
  },
  '/cervicogenic': {
    category: 'Assessment',
    label: 'Cervicogenic HA',
    text: 'Clinical presentation consistent with cervicogenic headache secondary to upper cervical joint dysfunction.',
    aliases: ['/cha', '/headache'],
  },
  '/prognosis': {
    category: 'Assessment',
    label: 'Good Prognosis',
    text: 'Prognosis is good with continued conservative care and patient compliance with treatment recommendations.',
    aliases: ['/prog', '/goodprog'],
  },

  // Plan shortcuts
  '/plan': {
    category: 'Plan',
    label: 'Continue Plan',
    text: 'Continue current treatment plan. Patient to return for follow-up visit as scheduled.',
    aliases: ['/continue', '/ctp'],
  },
  '/2x': {
    category: 'Plan',
    label: '2x per week',
    text: 'Recommend treatment frequency of 2 times per week for the next 2-4 weeks.',
    aliases: ['/2xweek', '/twice'],
  },
  '/3x': {
    category: 'Plan',
    label: '3x per week',
    text: 'Recommend treatment frequency of 3 times per week during the acute phase.',
    aliases: ['/3xweek', '/thrice'],
  },
  '/1x': {
    category: 'Plan',
    label: '1x per week',
    text: 'Recommend treatment frequency of 1 time per week for maintenance care.',
    aliases: ['/1xweek', '/weekly', '/maintenance'],
  },
  '/prn': {
    category: 'Plan',
    label: 'PRN',
    text: 'Patient may return on an as-needed basis for symptom management and wellness care.',
    aliases: ['/asneeded'],
  },
  '/reeval': {
    category: 'Plan',
    label: 'Re-evaluation',
    text: 'Re-evaluation scheduled in 30 days to assess progress and adjust treatment plan as needed.',
    aliases: ['/reexam', '/30day'],
  },
  '/refer': {
    category: 'Plan',
    label: 'Referral',
    text: 'Referral made to [SPECIALIST] for further evaluation and co-management.',
    aliases: ['/referral'],
  },
  '/imaging': {
    category: 'Plan',
    label: 'Imaging Ordered',
    text: 'Diagnostic imaging ordered to further evaluate the condition. X-ray / MRI of [REGION].',
    aliases: ['/xray', '/mri'],
  },
  '/discharge': {
    category: 'Plan',
    label: 'Discharge',
    text: 'Patient has reached maximum therapeutic benefit and is discharged from active care. May return as needed for future episodes.',
    aliases: ['/dc', '/mmb'],
  },
  '/goals': {
    category: 'Plan',
    label: 'Goals Met',
    text: 'Patient has met treatment goals including: decreased pain, improved ROM, improved function, and return to normal activities.',
    aliases: ['/goalsmet'],
  },

  // Treatment shortcuts
  '/adj': {
    category: 'Treatment',
    label: 'Adjustment',
    text: 'Spinal adjustment performed. Patient tolerated the adjustment well with no adverse reaction.',
    aliases: ['/adjusted', '/manipulation'],
  },
  '/estim': {
    category: 'Treatment',
    label: 'E-Stim',
    text: 'Electrical muscle stimulation applied to the affected area for 15 minutes to reduce muscle spasm and promote healing.',
    aliases: ['/ems', '/tens'],
  },
  '/ultrasound': {
    category: 'Treatment',
    label: 'Ultrasound',
    text: 'Therapeutic ultrasound applied to the affected area at 1.0 W/cm² for 5 minutes to promote tissue healing.',
    aliases: ['/us'],
  },
  '/heat': {
    category: 'Treatment',
    label: 'Heat Therapy',
    text: 'Moist heat therapy applied for 15 minutes to increase circulation and relax muscle tissue.',
    aliases: ['/hp', '/hotpack'],
  },
  '/ice': {
    category: 'Treatment',
    label: 'Ice Therapy',
    text: 'Cryotherapy applied for 15 minutes to reduce inflammation and provide analgesic effect.',
    aliases: ['/cryo', '/coldpack'],
  },
  '/stretch': {
    category: 'Treatment',
    label: 'Stretching',
    text: 'Therapeutic stretching performed to improve flexibility and reduce muscle tension. – 8 minutes',
    aliases: ['/stretching'],
  },
  '/massage': {
    category: 'Treatment',
    label: 'Massage',
    text: 'Therapeutic massage performed to reduce muscle tension and improve circulation. – 15 minutes',
    aliases: ['/softissue'],
  },
  '/traction': {
    category: 'Treatment',
    label: 'Traction',
    text: 'Mechanical traction applied at appropriate poundage for 15 minutes to decompress spinal segments.',
    aliases: ['/decompression'],
  },
  '/tolerated': {
    category: 'Treatment',
    label: 'Tolerated Well',
    text: 'Patient tolerated all procedures well with no adverse reactions noted.',
    aliases: ['/tol', '/noadverse'],
  },

  // Response shortcuts
  '/goodresponse': {
    category: 'Response',
    label: 'Good Response',
    text: 'Patient demonstrated good response to treatment with improved range of motion and decreased pain.',
    aliases: ['/gr', '/improved'],
  },
  '/excellent': {
    category: 'Response',
    label: 'Excellent Response',
    text: 'Patient demonstrated excellent response to treatment with significant symptomatic improvement.',
    aliases: ['/exc'],
  },
  '/fair': {
    category: 'Response',
    label: 'Fair Response',
    text: 'Patient demonstrated fair response to treatment with mild improvement noted. May require treatment modification.',
    aliases: ['/fr'],
  },
  '/poor': {
    category: 'Response',
    label: 'Poor Response',
    text: 'Patient demonstrated poor response to current treatment approach. Treatment plan modification indicated.',
    aliases: ['/pr', '/noresponse'],
  },
  '/soreness': {
    category: 'Response',
    label: 'Post-Tx Soreness',
    text: 'Patient advised that mild post-treatment soreness may occur for 24-48 hours. Ice application recommended as needed.',
    aliases: ['/posttx'],
  },
};

// Get all commands including aliases
function getAllCommandsWithAliases(commands) {
  const all = {};
  Object.entries(commands).forEach(([cmd, data]) => {
    all[cmd] = data;
    if (data.aliases) {
      data.aliases.forEach((alias) => {
        all[alias] = { ...data, isAlias: true, mainCommand: cmd };
      });
    }
  });
  return all;
}

// Hook for slash command text area
export function useSlashCommands(customCommands = {}) {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const allCommands = useMemo(
    () => getAllCommandsWithAliases({ ...DEFAULT_COMMANDS, ...customCommands }),
    [customCommands]
  );

  const filteredCommands = useMemo(() => {
    if (!searchTerm) {
      return [];
    }
    const search = searchTerm.toLowerCase();
    return Object.entries(allCommands)
      .filter(([cmd]) => cmd.toLowerCase().includes(search))
      .slice(0, 10);
  }, [searchTerm, allCommands]);

  const handleKeyDown = useCallback(
    (e, textareaRef, value, onChange) => {
      if (showMenu) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex((prev) => (prev < filteredCommands.length - 1 ? prev + 1 : 0));
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredCommands.length - 1));
        } else if (e.key === 'Enter' || e.key === 'Tab') {
          if (filteredCommands.length > 0) {
            e.preventDefault();
            const [_cmd, data] = filteredCommands[selectedIndex];
            // Replace the slash command with the text
            const beforeSlash = value.substring(0, value.lastIndexOf('/'));
            const afterCursor = value.substring(textareaRef.current?.selectionEnd || value.length);
            onChange(beforeSlash + data.text + afterCursor);
            setShowMenu(false);
            setSearchTerm('');
          }
        } else if (e.key === 'Escape') {
          setShowMenu(false);
          setSearchTerm('');
        }
      }
    },
    [showMenu, filteredCommands, selectedIndex]
  );

  const handleChange = useCallback((e, onChange) => {
    const value = e.target.value;
    const cursorPosition = e.target.selectionStart;

    // Check for slash command trigger
    const textBeforeCursor = value.substring(0, cursorPosition);
    const lastSlashIndex = textBeforeCursor.lastIndexOf('/');

    if (lastSlashIndex !== -1) {
      const textAfterSlash = textBeforeCursor.substring(lastSlashIndex);
      // Check if we're in a potential command (no spaces after slash)
      if (!textAfterSlash.includes(' ') && textAfterSlash.length > 0) {
        setSearchTerm(textAfterSlash);
        setShowMenu(true);
        setSelectedIndex(0);

        // Calculate menu position
        const textarea = e.target;
        const rect = textarea.getBoundingClientRect();
        setMenuPosition({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
        });
      } else {
        setShowMenu(false);
        setSearchTerm('');
      }
    } else {
      setShowMenu(false);
      setSearchTerm('');
    }

    onChange(value);
  }, []);

  const selectCommand = useCallback((cmd, data, value, onChange, textareaRef) => {
    const beforeSlash = value.substring(0, value.lastIndexOf('/'));
    const cursorPos = textareaRef.current?.selectionEnd || value.length;
    const afterCursor = value.substring(cursorPos);
    onChange(beforeSlash + data.text + afterCursor);
    setShowMenu(false);
    setSearchTerm('');
    textareaRef.current?.focus();
  }, []);

  return {
    showMenu,
    menuPosition,
    filteredCommands,
    selectedIndex,
    setSelectedIndex,
    handleKeyDown,
    handleChange,
    selectCommand,
    closeMenu: () => {
      setShowMenu(false);
      setSearchTerm('');
    },
  };
}

// Slash Commands Menu Component
export function SlashCommandMenu({ show, position, commands, selectedIndex, onSelect, onClose }) {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };

    if (show) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [show, onClose]);

  if (!show || commands.length === 0) {
    return null;
  }

  // Group commands by category
  const grouped = {};
  commands.forEach(([cmd, data], index) => {
    if (!grouped[data.category]) {
      grouped[data.category] = [];
    }
    grouped[data.category].push({ cmd, data, index });
  });

  return (
    <div
      ref={menuRef}
      className="fixed z-50 w-80 max-h-64 overflow-y-auto bg-white rounded-lg shadow-xl border border-gray-200"
      style={{ top: position.top + 5, left: position.left }}
    >
      <div className="sticky top-0 px-3 py-2 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
        <Command className="w-4 h-4 text-gray-400" />
        <span className="text-xs text-gray-500">Slash Commands</span>
        <span className="ml-auto text-xs text-gray-400">↑↓ Navigate · Enter Select</span>
      </div>

      {Object.entries(grouped).map(([category, items]) => (
        <div key={category}>
          <div className="px-3 py-1 text-xs font-medium text-gray-500 bg-gray-50">{category}</div>
          {items.map(({ cmd, data, index }) => (
            <button
              key={cmd}
              onClick={() => onSelect(cmd, data)}
              className={`
                w-full px-3 py-2 text-left flex items-center gap-2 transition-colors
                ${index === selectedIndex ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'}
              `}
            >
              <code className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded">{cmd}</code>
              <span className="text-sm text-gray-700 truncate">{data.label}</span>
              <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

// Enhanced Text Area with Slash Commands
export default function SlashCommandTextArea({
  value,
  onChange,
  placeholder,
  rows = 3,
  label,
  className = '',
  customCommands = {},
  ...props
}) {
  const textareaRef = useRef(null);
  const {
    showMenu,
    menuPosition,
    filteredCommands,
    selectedIndex,
    _setSelectedIndex,
    handleKeyDown,
    handleChange,
    selectCommand,
    closeMenu,
  } = useSlashCommands(customCommands);

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          <span className="ml-2 text-xs text-gray-400 font-normal">Type "/" for commands</span>
        </label>
      )}

      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => handleChange(e, onChange)}
        onKeyDown={(e) => handleKeyDown(e, textareaRef, value, onChange)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        {...props}
      />

      <SlashCommandMenu
        show={showMenu}
        position={menuPosition}
        commands={filteredCommands}
        selectedIndex={selectedIndex}
        onSelect={(cmd, data) => selectCommand(cmd, data, value, onChange, textareaRef)}
        onClose={closeMenu}
      />
    </div>
  );
}

// Command Reference Card
export function SlashCommandReference({ category = null, compact = false }) {
  const commands = useMemo(() => {
    let cmds = Object.entries(DEFAULT_COMMANDS);
    if (category) {
      cmds = cmds.filter(([, data]) => data.category === category);
    }
    return cmds;
  }, [category]);

  if (compact) {
    return (
      <div className="flex flex-wrap gap-1">
        {commands.slice(0, 10).map(([cmd]) => (
          <code
            key={cmd}
            className="text-xs bg-gray-100 px-1.5 py-0.5 rounded font-mono text-gray-600"
          >
            {cmd}
          </code>
        ))}
        {commands.length > 10 && (
          <span className="text-xs text-gray-400">+{commands.length - 10} more</span>
        )}
      </div>
    );
  }

  // Group by category
  const grouped = {};
  commands.forEach(([cmd, data]) => {
    if (!grouped[data.category]) {
      grouped[data.category] = [];
    }
    grouped[data.category].push({ cmd, ...data });
  });

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Command className="w-4 h-4" />
          Slash Commands Reference
        </h3>
        <p className="text-xs text-gray-500 mt-1">Type these shortcuts to auto-expand text</p>
      </div>

      <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
        {Object.entries(grouped).map(([cat, cmds]) => (
          <div key={cat} className="p-3">
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">{cat}</h4>
            <div className="space-y-1">
              {cmds.map(({ cmd, label, _text }) => (
                <div key={cmd} className="flex items-start gap-2 text-sm">
                  <code className="flex-shrink-0 font-mono text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
                    {cmd}
                  </code>
                  <span className="text-gray-600 text-xs line-clamp-1">{label}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Export default commands
export { DEFAULT_COMMANDS };
