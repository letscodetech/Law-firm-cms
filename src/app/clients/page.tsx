import ClientTable from "../frontend/components/ClientTable";

const ClientsList = () => {
  return (
    <div>
      <h1 className="text-4xl font-bold mb-8 mt-8 text-center">
        <span className="bg-gradient-to-r from-emerald-400 via-green-400 to-teal-500 bg-clip-text text-transparent animate-pulse drop-shadow-md">
          Clients
        </span>
      </h1>
      <ClientTable />
    </div>
  );
};

export default ClientsList;
