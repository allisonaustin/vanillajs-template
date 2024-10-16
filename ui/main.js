import { mountBarChart, BarChart } from './src/example.js'
import {mountChart, Sankey } from './src/sankeyComponent.js'
import './styles/main.css'

async function getSurveyData() {
  const flaskUrl = `http://127.0.0.1:5001/getData`;
  try {
    const res = await fetch(flaskUrl);
    if (!res.ok) {
      throw new Error('Error getting data.');
    }
    const data = await res.json();
    return data.data
  } catch (error) {
    console.error('Error:', error);
  }
}

// You can manage your layout through CSS, or this template also has materialize library supported.
// Materialize: https://materializecss.com/getting-started.html

document.querySelector('#main').innerHTML = `
  <div id='main-container' class='d-flex flex-column flex-nowrap'>
    <div class="view_title">
          <h3 class="header center-align">Music Survey Results</h3>
        </div>
    ${Sankey()}
  </div>
`

const surveyData = await getSurveyData();
mountChart(surveyData)
// mountBarChart();