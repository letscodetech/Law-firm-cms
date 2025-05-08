import ClientTable from "../frontend/components/ClientTable";
const ClientsList = () => { // Fixing the syntax here
    return (
      <div>
<h1 className="text-2xl font-semibold mb-8 mt-8 text-center">Clients</h1>
<ClientTable />
      </div>
    );
};

export default ClientsList;
