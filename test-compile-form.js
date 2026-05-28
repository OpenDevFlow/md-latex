async function run() {
  const latex = "\\documentclass{article}\\begin{document}Hello Form\\end{document}";
  
  const formData = new FormData();
  formData.append('file', new Blob([latex], { type: 'text/plain' }), 'main.tex');

  const res = await fetch('https://latexonline.cc/data?target=main.tex', {
    method: 'POST',
    body: formData,
  });
  
  if (res.ok) {
    console.log("SUCCESS, status:", res.status);
    console.log("Content-Type:", res.headers.get('content-type'));
  } else {
    console.log("FAILED, status:", res.status);
    console.log(await res.text());
  }
}
run();
