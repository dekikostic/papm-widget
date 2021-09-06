(function () {
  const template = document.createElement('template');
  template.innerHTML = `
      <style>
      </style>
      <div id="root" style="width: 100%; height: 100%;">
      </div>
    `;

  class MainWebComponent extends HTMLElement {
    constructor() {
      super();
      let shadowRoot = this.attachShadow({ mode: 'open' });
      shadowRoot.appendChild(template.content.cloneNode(true));
    }
    onCustomWidgetBeforeUpdate(changedProperties) {
      this._props = { ...this._props, ...changedProperties };
    }

    onCustomWidgetAfterUpdate(changedProperties) {
      this._props = { ...this._props, ...changedProperties };
    }

    //function called from SAC Analytic Application
    async run(system,tenant) {
      const BASE_URL = 'http://localhost:3500/runAsync';
      try {
        const runRequest = await fetch(
          `${BASE_URL}?EnvId='${this._props.env_id}'&Ver='${this._props.ver}'&ProcId=''&Activity=''&Fid='${this._props.fid}'&system=${system}&tenant=${tenant}`,
          {
            method: 'POST',
          },
        );

        const runResponse = await runRequest.json();

        console.log(runResponse);

        return runResponse;

        // return msg.value;
      } catch (status) {
        console.log(status);
        new Error();
      }
    }
  }

  customElements.define('papm-run-func', MainWebComponent);
})();
