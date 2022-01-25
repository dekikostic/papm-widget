/* eslint-disable prettier/prettier */
import type { RunParam } from './types';
import { Injectable } from '@nestjs/common';
import fetch from 'node-fetch';
import 'dotenv/config.js';
// import {} from 'dotenv/config';
// require('dotenv').config();

@Injectable()
export class AppService {
  async RunAsync(runParam: RunParam) {
    const baseUrl = `https://papm-cloud-api-${runParam.space}.cfapps.eu10.hana.ondemand.com/sap/opu/odata/NXI/`;
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

    const runUrl = `${baseUrl}P1_N_MOD_SRV/RunAsync?EnvId=${runParam.EnvId}&Ver=${runParam.Ver}&ProcId=''&Activity=''&Fid=${runParam.Fid}`;
    const runRequest = await fetch(runUrl, {
      method: 'post',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const runResponse = await runRequest.json();
    const runId = runResponse.d.Content.RUN_ID;

    let encodedUrl = encodeURI(
      `${baseUrl}P1_N_APP_ODATA_SRV/Entities/AL?$filter=RUN_ID eq '${runId}'`,
    );

    let runState = 'RUNNING';

    while (runState === 'RUNNING') {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const alRequest = await fetch(encodedUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const alResponse = await alRequest.json();
      runState = alResponse.value[0].RUN_STATE;
    }
    // when partitioning used, almsg is not immediately populated
    await new Promise((resolve) => setTimeout(resolve, 3000));
    encodedUrl = encodeURI(
      `${baseUrl}P1_N_APP_ODATA_SRV/Entities/ALMSG?$filter=RUN_ID eq '${runId}'`,
    );
    const almsgRequest = await fetch(encodedUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const almsgResponse = await almsgRequest.json();

    const msg = [];
    almsgResponse.value.forEach((element) => {
      if (element.MSG_TEXT !== '') {
        msg.push(`${element.MSGTY}###${element.MSG_TEXT}`);
      }
    });

    console.log(msg);
    return msg;
  }
}
