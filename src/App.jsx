import React, { useEffect, useState } from 'react';
import GovHeader from './components/GovHeader.jsx';
import OsStepBar from './components/OsStepBar.jsx';
import ScenarioDemo from './components/ScenarioDemo.jsx';
import PresenterControl from './components/PresenterControl.jsx';
import DashboardScreen from './screens/DashboardScreen.jsx';
import DivorceScreen from './screens/DivorceScreen.jsx';
import EServicesScreen from './screens/EServicesScreen.jsx';
import FilingScreen from './screens/FilingScreen.jsx';
import { DEFAULT_RULE_CONFIG } from './data/scenarios.js';

const PRESENTER_KEY = 'syc_presenter_config_v1';

function loadPresenter() {
  try {
    return { ...DEFAULT_RULE_CONFIG, ...JSON.parse(localStorage.getItem(PRESENTER_KEY)) };
  } catch { return { ...DEFAULT_RULE_CONFIG }; }
}

export default function App() {
  const [lang, setLang] = useState('en');
  // Lead-up navigation: dashboard → divorce → eservices → filing → demo.
  const [route, setRoute] = useState('dashboard');
  const [controlOpen, setControlOpen] = useState(false);
  const [presenterConfig, setPresenterConfig] = useState(loadPresenter);
  const [activeRuleConfig, setActiveRuleConfig] = useState(() => ({ ...loadPresenter() }));
  const [scenarioId, setScenarioId] = useState('10');
  const [applicationKey, setApplicationKey] = useState(0);

  useEffect(() => {
    localStorage.setItem(PRESENTER_KEY, JSON.stringify(presenterConfig));
  }, [presenterConfig]);

  useEffect(() => {
    function shortcut(event) {
      if (event.ctrlKey && event.altKey && event.shiftKey && event.key.toLowerCase() === 'c') {
        event.preventDefault(); setControlOpen((value) => !value);
      } else if (event.key === 'Escape') setControlOpen(false);
    }
    window.addEventListener('keydown', shortcut);
    return () => window.removeEventListener('keydown', shortcut);
  }, []);

  // Start (or offer to resume) the filing flow the first time we enter the demo.
  function enterDemo() {
    setRoute('demo');
  }

  function navigate(to) {
    if (to === 'demo') enterDemo();
    else setRoute(to);
  }

  function launchScenario(id) {
    localStorage.removeItem('syc_scenario_case_v2');
    setScenarioId(id);
    setActiveRuleConfig({ ...presenterConfig });
    setApplicationKey((value) => value + 1);
    setRoute('demo');
    setControlOpen(false);
  }

  function startNew() {
    localStorage.removeItem('syc_scenario_case_v2');
    setApplicationKey((value) => value + 1);
    setRoute('dashboard');
  }

  return (
    <>
      <GovHeader route={route} onNav={navigate} />

      {route === 'dashboard' && <DashboardScreen onNav={navigate} />}
      {route === 'divorce' && <DivorceScreen onNav={navigate} />}
      {route === 'eservices' && <EServicesScreen onNav={navigate} />}
      {route === 'filing' && <FilingScreen onNav={navigate} />}

      {route === 'demo' && (
        <ScenarioDemo key={`${scenarioId}-${applicationKey}`} scenarioId={scenarioId} ruleConfig={activeRuleConfig} lang={lang} onSetLang={setLang} onStartNew={startNew} />
      )}
      <PresenterControl open={controlOpen} onClose={() => setControlOpen(false)} config={presenterConfig}
        onChangeConfig={setPresenterConfig} onLaunch={launchScenario} currentScenario={scenarioId} />
    </>
  );
}
