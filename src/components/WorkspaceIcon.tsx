const paths = {
  map: 'M4 16V9m5 7V5m5 11v-5m5 5V3M3 20h18',
  strategy: 'M7 3h10l3 3v15H4V3h3m1 5h8m-8 5h8m-8 4h5',
  import: 'M12 15V3m-4 4 4-4 4 4M4 14v6h16v-6',
  judge: 'm4 12 5 5L20 6',
  log: 'M8 7h12M8 12h12M8 17h12M3 7h.01M3 12h.01M3 17h.01',
  edit: 'm15 4 5 5M4 20l5-1L21 7l-5-5L4 14v6Z',
  plus: 'M12 5v14M5 12h14',
  arrow: 'M4 12h16m-6-6 6 6-6 6',
  chevron: 'm9 5 7 7-7 7',
} as const

export function WorkspaceIcon({ name }: { name: keyof typeof paths }) {
  return (
    <svg
      className="workspace-icon"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d={paths[name]}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
