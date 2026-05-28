async function run() {
  const latex = "\\documentclass{article}\\begin{document}Hello Texlive\\end{document}";
  
  const formData = new FormData();
  formData.append('filecontents[]', latex);
  formData.append('filename[]', 'document.tex');
  formData.append('engine', 'pdflatex');
  formData.append('return', 'pdf');

  const res = await fetch('https://texlive.net/cgi-bin/latexcgi', {
    method: 'POST',
    body: formData,
  });
  
  if (res.ok) {
    console.log("SUCCESS, status:", res.status);
    console.log("Content-Type:", res.headers.get('content-type'));
    const text = await res.text();
    console.log("starts with %PDF?", text.startsWith("%PDF"));
  } else {
    console.log("FAILED, status:", res.status);
    console.log(await res.text());
  }
}
run();
