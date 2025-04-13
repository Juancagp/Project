import { useState } from "react";
import { Satellite } from "../models/Satellite";
import "./SatellitesTable.css";

interface Props {
  satellites: Satellite[];
}

function SatellitesTable({ satellites }: Props) {
  const [selectedCountry, setSelectedCountry] = useState<string>("Todos");
  const [missionFilter, setMissionFilter] = useState<string>("");

  const countries = Array.from(
    new Set(satellites.map((sat) => sat.organization.country.name))
  );

  const filteredSatellites = satellites.filter((sat) => {
    const matchCountry =
      selectedCountry === "Todos" || sat.organization.country.name === selectedCountry;

    const matchMission = sat.mission
      .toLowerCase()
      .includes(missionFilter.toLowerCase());

    return matchCountry && matchMission;
  });

  const satsSorted = filteredSatellites
    .filter((sat) => sat.name)
    .sort((a, b) => b.altitude - a.altitude);

  return (
    <div className="table-container">
      <h2>🛰️ Satélites en órbita ({satsSorted.length})</h2>

      <div style={{ marginBottom: "1rem" }}>
        <label>Filtrar por País: </label>
        <select
          value={selectedCountry}
          onChange={(e) => setSelectedCountry(e.target.value)}
        >
          <option value="Todos">Todos</option>
          {countries.map((country) => (
            <option key={country} value={country}>
              {country}
            </option>
          ))}
        </select>

        <label style={{ marginLeft: "1rem" }}>Filtrar por Misión: </label>
        <input
          type="text"
          value={missionFilter}
          onChange={(e) => setMissionFilter(e.target.value)}
        />
      </div>

      <table className="satellites-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Bandera</th>
            <th>Satélite</th>
            <th>Misión</th>
            <th>Tipo</th>
            <th>Potencia</th>
            <th>Altitud</th>
            <th>Vida útil</th>
          </tr>
        </thead>
        <tbody>
          {satsSorted.map((sat) => (
            <tr key={sat.satellite_id}>
              <td>{sat.satellite_id}</td>
              <td>
                {sat.organization.country.country_code ? (
                  <>
                    <img
                      src={`https://flagcdn.com/w40/${sat.organization.country.country_code.toLowerCase()}.png`}
                      alt={sat.organization.country.name}
                      style={{ marginRight: "5px", verticalAlign: "middle" }}
                    />
                    {sat.organization.name}
                  </>
                ) : (
                  "-"
                )}
              </td>
              <td>{sat.name}</td>
              <td>{sat.mission}</td>
              <td>{sat.type}</td>
              <td>{sat.power}</td>
              <td>{sat.altitude}</td>
              <td>{sat.lifespan}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default SatellitesTable;
