# Instalación Node.js sin permisos de administrador
2
 
3
## Problema
4
 
5
Equipo corporativo sin privilegios de administrador.
6
 
7
Error:
8
 
9
node no se reconoce
10
npm no se reconoce
11
 
12
## Solución
13
 
14
Crear carpeta:
15
 
16
C:\Users\<usuario>\Tools
17
 
18
Descargar:
19
 
20
https://nodejs.org/dist/v24.18.0/node-v24.18.0-win-x64.zip
21
 
22
Extraer:
23
 
24
C:\Users\<usuario>\Tools\node-v24.18.0-win-x64
25
 
26
Validar:
27
 
28
C:\Users\<usuario>\Tools\node-v24.18.0-win-x64\node.exe -v
29
 
30
Resultado esperado:
31
 
32
v24.18.0
33
 
34
Validar npm:
35
 
36
C:\Users\<usuario>\Tools\node-v24.18.0-win-x64\npm.cmd -v
37
 
38
Resultado esperado:
39
 
40
11.16.0
41
 
42
Instalar dependencias del proyecto:
43
 
44
C:\Users\<usuario>\Tools\node-v24.18.0-win-x64\npm.cmd install
45
 
46
Ejecutar proyecto:
47
 
48
C:\Users\<usuario>\Tools\node-v24.18.0-win-x64\node.exe src/server.js