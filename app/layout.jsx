// app/layout.jsx
export const metadata = {
  title:       'ViciTarif — Tarificador Vicidial',
  description: 'Dashboard de tarificación de llamadas para Vicidial',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          body { background: #0f1117; color: #e8eaf0; }
          input, select, button { font-family: inherit; }
          input[type=number]::-webkit-inner-spin-button,
          input[type=number]::-webkit-outer-spin-button { opacity: 1; }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
