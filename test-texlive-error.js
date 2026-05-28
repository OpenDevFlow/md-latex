async function run() {
  const latex = "\\documentclass{article}\\begin{document}\\undefinedcommand Hello\\end{document}";
  
  const formData = new FormData();
  formData.append('filecontents[]', latex);
  formData.append('filename[]', 'document.tex');
  formData.append('engine', 'pdflatex');
  formData.append('return', 'pdf');

  const res = await fetch('https://texlive.net/cgi-bin/latexcgi', {
    method: 'POST',
    body: formData,
  });
  
  console.log("status:", res.status);
  console.log("Content-Type:", res.headers.get('content-type'));
  const text = await res.text();
  console.log("Response text start:", text.substring(0, 100));
}
run();
