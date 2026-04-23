// components/PhilosophyClient.jsx
"use client";
import React from "react";
import AboutPhilosophyClient from "./components/AboutPhilosophyClient";
import AboutUsClient from "../common/components/AboutUsClient";
import AboutCoreValuesClient from "./components/AboutCoreValuesClient";
import AboutBusinessAreasClient from "./components/AboutBusinessAreasClient";
import AboutCommunityClient from "./components/AboutCommunityClient";

const AboutClinent = () => (
  <section>
    <AboutUsClient />
    <AboutPhilosophyClient />
    <AboutCoreValuesClient />

      <AboutBusinessAreasClient />
      <AboutCommunityClient/>

  </section>
);

export default AboutClinent;
