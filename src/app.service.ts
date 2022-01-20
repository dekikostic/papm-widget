/* eslint-disable prettier/prettier */
import type { RunParam } from './types';
import { Injectable } from '@nestjs/common';
import fetch from 'node-fetch';
import 'dotenv/config.js';
// import {} from 'dotenv/config';
// require('dotenv').config();

const URL_PREFIX = 'https://papm-cloud-api-';
const DEFAULT_TENANT = 'qam-papm';
const DEFAULT_SPACE = 'prod-dev';
const DOMAIN = '.cfapps.eu10.hana.ondemand.com/sap/opu/odata/NXI/';

@Injectable()
export class AppService {
  async RunAsync(runParam: RunParam) {
    const tenant =
      runParam.tenant !== undefined ? runParam.tenant : DEFAULT_TENANT;
    const space = runParam.space !== undefined ? runParam.space : DEFAULT_SPACE;

    const authUrl = `https://${tenant}.${process.env.AUTH_URL}`;
    const base_auth =
      tenant === DEFAULT_TENANT
        ? process.env.BASIC_AUTH_PROD_DEV
        : process.env.BASIC_AUTH_PROD_POV;

    const tokenRequest = await fetch(authUrl, {
      method: 'post',
      headers: { Authorization: base_auth },
    });

    const tokenResponse = await tokenRequest.json();
    const token = tokenResponse.access_token;

    console.log(token);

    const runUrl = `${URL_PREFIX}${tenant}.${space}${DOMAIN}P1_N_MOD_SRV/RunAsync?EnvId=${runParam.EnvId}&Ver=${runParam.Ver}&ProcId=''&Activity=''&Fid=${runParam.Fid}`;
    const runRequest = await fetch(runUrl, {
      method: 'post',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const runResponse = await runRequest.json();
    const runId = runResponse.d.Content.RUN_ID;

    let encodedUrl = encodeURI(
      `${URL_PREFIX}${tenant}${DOMAIN}P1_N_APP_ODATA_SRV/Entities/AL?$filter=RUN_ID eq '${runId}'`,
    );

    let runState = 'RUNNING';

    while (runState === 'RUNNING') {
      await new Promise((resolve) => setTimeout(resolve, 50));
      const alRequest = await fetch(encodedUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const alResponse = await alRequest.json();
      runState = alResponse.value[0].RUN_STATE;
    }

    encodedUrl = encodeURI(
      `${URL_PREFIX}${tenant}${DOMAIN}P1_N_APP_ODATA_SRV/Entities/ALMSG?$filter=RUN_ID eq '${runId}'`,
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
