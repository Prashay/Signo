import { useState } from 'react'
import {
  ChevronRight,
  Folder,
  Hash,
  Radio,
  Search,
  X,
  Layers,
  ChevronDown,
  ChevronsUpDown
} from 'lucide-react'
import { formatBytes, formatTime } from '../lib/mqttTree.js'
import { useThemeSettings } from '../context/ThemeSettingsContext.jsx'

function TreeNode({ node, depth, selected, onSelect, isDark }) {
  const kids = Object.values(node.children || {}).sort((a, b) => a.name.localeCompare(b.name))
  const [open, setOpen] = useState(depth < 2 || kids.length < 8)
  const isLeaf = kids.length === 0
  const active = selected === node.path

  return (
    <div>
      <button
        className={`group relative flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs transition-all ${
          active
            ? isDark
              ? 'bg-gradient-to-r from-indigo-600/25 to-violet-600/15 text-white font-semibold shadow-xs'
              : 'bg-indigo-50 text-indigo-950 font-bold border-r-2 border-indigo-600'
            : isDark
            ? 'text-mist-200 hover:bg-white/[0.04] hover:text-white'
            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
        }`}
        style={{ paddingLeft: 10 + depth * 14 }}
        onClick={() => onSelect(node)}
      >
        {kids.length > 0 ? (
          <span
            onClick={(e) => {
              e.stopPropagation()
              setOpen((v) => !v)
            }}
            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded p-0.5 transition-transform ${
              open ? 'rotate-90' : ''
            } ${isDark ? 'text-mist-400 hover:text-white' : 'text-slate-400 hover:text-slate-700'}`}
          >
            <ChevronRight size={13} />
          </span>
        ) : (
          <span className="w-4" />
        )}

        {isLeaf ? (
          <Hash
            size={13}
            className={`shrink-0 ${
              active
                ? isDark ? 'text-cyan-300' : 'text-indigo-600'
                : isDark ? 'text-cyan-400/80' : 'text-indigo-500'
            }`}
          />
        ) : (
          <Folder
            size={13}
            className={`shrink-0 ${
              open
                ? isDark ? 'text-violet-400' : 'text-indigo-600'
                : isDark ? 'text-mist-400' : 'text-slate-400'
            }`}
          />
        )}

        <span className="truncate">{node.name || '/'}</span>

        {node.count > 0 && (
          <span
            className={`ml-auto shrink-0 rounded-full px-1.5 py-0.2 font-mono text-[9px] font-medium border ${
              active
                ? isDark
                  ? 'border-indigo-500/40 bg-indigo-500/20 text-indigo-200'
                  : 'border-indigo-300 bg-indigo-100 text-indigo-800'
                : isDark
                ? 'border-white/5 bg-white/5 text-mist-400'
                : 'border-slate-200 bg-slate-100 text-slate-600'
            }`}
          >
            {node.count}
          </span>
        )}
      </button>

      {open &&
        kids.map((child) => (
          <TreeNode
            key={child.path}
            node={child}
            depth={depth + 1}
            selected={selected}
            onSelect={onSelect}
            isDark={isDark}
          />
        ))}
    </div>
  )
}

export default function TopicTree({ tree, selected, onSelect, filter, onFilter, title }) {
  const { theme } = useThemeSettings()
  const isDark = theme === 'dark'

  const kids = tree?.children ? Object.values(tree.children).sort((a, b) => a.name.localeCompare(b.name)) : []

  return (
    <div
      className={`flex h-full min-h-0 flex-col transition-colors border-r ${
        isDark ? 'bg-[#080a11] border-white/[0.06] text-mist-100' : 'bg-slate-50/50 border-slate-200 text-slate-800'
      }`}
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between border-b px-3.5 py-3 ${
          isDark ? 'border-white/[0.06] bg-[#0c0e18]/60' : 'border-slate-200 bg-white'
        }`}
      >
        <div className="flex items-center gap-2">
          <Radio size={14} className={isDark ? 'text-cyan-400' : 'text-indigo-600'} />
          <span className="truncate font-display text-xs font-bold tracking-tight">
            {title || 'Topic Tree'}
          </span>
        </div>
        <span
          className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-medium border ${
            isDark ? 'border-white/10 bg-white/5 text-mist-400' : 'border-slate-200 bg-slate-100 text-slate-600'
          }`}
        >
          {tree?.count || 0} msgs
        </span>
      </div>

      {/* Search Filter Bar */}
      <div className={`p-2.5 border-b ${isDark ? 'border-white/[0.04]' : 'border-slate-200/70'}`}>
        <div className="relative">
          <Search
            size={13}
            className={`absolute left-2.5 top-1/2 -translate-y-1/2 ${
              isDark ? 'text-mist-500' : 'text-slate-400'
            }`}
          />
          <input
            value={filter}
            onChange={(e) => onFilter(e.target.value)}
            placeholder="Search topic hierarchy..."
            className={`w-full rounded-xl border py-1.5 pl-8 pr-7 text-xs outline-none transition-all ${
              isDark
                ? 'border-white/10 bg-white/[0.03] text-mist-100 placeholder-mist-500 focus:border-indigo-500/60 focus:bg-white/[0.06]'
                : 'border-slate-200 bg-white text-slate-900 placeholder-slate-400 shadow-2xs focus:border-indigo-500'
            }`}
          />
          {filter && (
            <button
              onClick={() => onFilter('')}
              className={`absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 ${
                isDark ? 'text-mist-400 hover:text-white' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Tree View Content */}
      <div className="min-h-0 flex-1 overflow-y-auto py-1">
        {kids.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <Layers size={22} className={`mx-auto mb-2 ${isDark ? 'text-mist-600' : 'text-slate-400'}`} />
            <p className={`text-xs ${isDark ? 'text-mist-400' : 'text-slate-500'}`}>
              No incoming messages yet.
            </p>
            <p className={`text-[11px] mt-1 ${isDark ? 'text-mist-500' : 'text-slate-400'}`}>
              Connect to a broker or start the Store demo.
            </p>
          </div>
        ) : (
          kids.map((child) => (
            <TreeNode
              key={child.path}
              node={child}
              depth={0}
              selected={selected}
              onSelect={onSelect}
              isDark={isDark}
            />
          ))
        )}
      </div>

      {selected && (
        <div
          className={`border-t px-3 py-2 text-[10px] font-mono truncate ${
            isDark ? 'border-white/[0.04] bg-white/[0.01] text-mist-400' : 'border-slate-200 bg-slate-50 text-slate-500'
          }`}
        >
          Path: <span className="font-semibold text-indigo-500">{selected}</span>
        </div>
      )}
    </div>
  )
}

export function TopicMeta({ node }) {
  if (!node?.latest) return null
  return (
    <div className="flex flex-wrap gap-2.5 font-mono text-[11px]">
      <span className="text-mist-400">{formatTime(node.latest.timestamp)}</span>
      <span className="text-mist-400">{formatBytes(node.latest.payload.size)}</span>
      <span className="rounded bg-white/5 px-1 py-0.2 text-[10px]">QoS {node.latest.qos}</span>
      {node.latest.retain && <span className="text-amber-400 font-medium">Retained</span>}
    </div>
  )
}

