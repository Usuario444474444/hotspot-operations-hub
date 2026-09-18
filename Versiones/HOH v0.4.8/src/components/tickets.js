export function renderTickets(container, tickets, detailHandler) {
  container.innerHTML = tickets.map(ticket => `
    <div class="ticket-card" data-id="${ticket.number}">
      <strong>${ticket.store}</strong><br>
      SAP ${ticket.sap}<br>
      ${ticket.state}
    </div>
  `).join("");

  container.querySelectorAll(".ticket-card").forEach(card => {
    card.addEventListener("click", () => {
      const ticket = tickets.find(t => t.number === card.dataset.id);
      detailHandler(ticket);
    });
  });
}
