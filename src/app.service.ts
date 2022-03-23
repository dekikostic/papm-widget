/* eslint-disable prettier/prettier */
import type { RunParam } from './types';
import { Injectable } from '@nestjs/common';
import fetch from 'node-fetch';
import 'dotenv/config.js';
import { isEmpty } from 'lodash';

@Injectable()
export class AppService {
  async RunAsync(runParam: RunParam) {
    const baseUrl = `https://papm-cloud-api-${runParam.space}.cfapps.eu10.hana.ondemand.com/sap/opu/`;
    const authUrl = `https://${runParam.tenant}.authentication.eu10.hana.ondemand.com/oauth/token?grant_type=client_credentials`;

    let baseAuth = '';
    switch (runParam?.space) {
      case 'prod-dev':
        baseAuth = process.env.BASIC_AUTH_PROD_DEV;
        break;
      case 'prod-pov':
        baseAuth = process.env.BASIC_AUTH_PROD_POV;
        break;
      default:
        throw new Error(
          `Credentials for space:${runParam.space} not available`,
        );
    }

    const tokenRequest = await fetch(authUrl, {
      method: 'post',
      headers: { Authorization: baseAuth },
    });

    const tokenResponse = await tokenRequest.json();
    const token = tokenResponse.access_token;

    console.log(
      new Date().toUTCString(),
      ` - Run initiated: EnvId=${runParam.EnvId} Ver=${runParam.Ver} Fid=${runParam.Fid}`,
    );
    const runUrl = `${baseUrl}odata/NXI/P1_N_MOD_SRV/RunAsync?EnvId=${runParam.EnvId}&Ver=${runParam.Ver}&ProcId=''&Activity=''&Fid=${runParam.Fid}`;
    const runRequest = await fetch(runUrl, {
      method: 'post',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const runResponse = await runRequest.json();
    const runId = runResponse.d.Content.RUN_ID;

    let encodedUrl = encodeURI(
      `${baseUrl}odata4/NXI/P1_APP_MONITOR/AL?$filter=RUN_ID eq '${runId}'`,
    );

    let runState = 'RUNNING';

    while (runState === 'RUNNING') {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const alRequest = await fetch(encodedUrl, {
        headers: {
          accept: 'application/json;IEEE754Compatible=true',
          Authorization: `Bearer ${token}`,
        },
      });

      const alResponse = await alRequest.json();
      const runCompleted = alResponse.value.every(
        (element) => element.RUN_STATE === 'OK',
      );
      if (runCompleted) {
        runState = 'OK'; // alResponse.value[0].RUN_STATE;
      }
      console.log(
        new Date().toUTCString(),
        ` - Checking run state for RUN_ID:${runId}...${runState}`,
      );
    }

    // when partitioning used, almsg is not immediately populated
    await new Promise((resolve) => setTimeout(resolve, 3000));

    console.log(new Date().toUTCString(), ` - Fetching messages`);
    encodedUrl = encodeURI(
      `${baseUrl}odata4/NXI/P1_APP_MONITOR/ALMSG?$filter=RUN_ID eq '${runId}'`,
    );
    const almsgRequest = await fetch(encodedUrl, {
      headers: {
        accept: 'application/json;IEEE754Compatible=true',
        Authorization: `Bearer ${token}`,
      },
    });

    const almsgResponse = await almsgRequest.json();
    const messages = almsgResponse?.value
      .filter((f) => !isEmpty(f.MSG_TEXT) && f.FID === runParam.Fid)
      .map((message) => `${message.MSGTY}###${message.MSG_TEXT}`);

    messages.push('S###Run is completed');
    console.log(messages);
    console.log(new Date().toUTCString(), ` - Run is completed`);

    return messages;
  }
}
