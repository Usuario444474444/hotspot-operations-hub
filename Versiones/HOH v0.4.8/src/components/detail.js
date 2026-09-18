export function renderDetail(ticket) {
  document.getElementById("detail").innerHTML = `
    <h2>${ticket.number}</h2>
    <p>SAP ${ticket.sap}</p>
    <h3>Salud SAP</h3>
    <p>Riesgo: Medio</p>
  `;
}
