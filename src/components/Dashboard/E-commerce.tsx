"use client";

import React from "react";

import EntradasCard from "../EntradasCard/EntradasCard";
import SaidasCard from "../SaidasCard/SaidasCard";
import SaldoDiferencaContainer from "../SaldoDiferencaContainer/SaldoDiferencaContainer";
import QuantidadeMembrosCard from "../MembrosCard/MembrosCard";
import ContasAPagarList from "../ContasaPagarList/ContasaPagarList";

import GraficoEntradasSaidas from "../Charts/Grafico";

const ECommerce: React.FC = () => {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5">
        <SaldoDiferencaContainer />
        <EntradasCard />
        <SaidasCard />
        <QuantidadeMembrosCard />
      </div>

      <div className="">
        <GraficoEntradasSaidas altura="200px" />
      </div>

      <ContasAPagarList />
    </>
  );
};

export default ECommerce;
