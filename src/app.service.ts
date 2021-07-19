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
    const tokenRequest = await fetch(process.env.AUTH_URL, {
      method: 'post',
      headers: {
        Authorization: process.env.BASIC_AUTH,
      },
    });

    const tokenResponse = await tokenRequest.json();
    const token = tokenResponse.access_token;

    const runRequest = await fetch(
      `${process.env.BASE_URL}/RunAsync?EnvId=${runParam.EnvId}&Ver=${runParam.Ver}&ProcId=''&Activity=''&Fid=${runParam.Fid}`,
      {
        method: 'post',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const runResponse = await runRequest.json();
    const runId = runResponse.d.Content.RUN_ID;

    let encodedUrl = encodeURI(
      `${process.env.ODATA_BASE_URL}/Entities/AL?$filter=RUN_ID eq '${runId}'`,
    );

    let runState = 'RUNNING';

    while (runState === 'RUNNING') {
      await new Promise((resolve) => setTimeout(resolve, 50));
      let alRequest = await fetch(encodedUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      let alResponse = await alRequest.json();
      runState = alResponse.value[0].RUN_STATE;
    }

    encodedUrl = encodeURI(
      `${process.env.ODATA_BASE_URL}/Entities/ALMSG?$filter=RUN_ID eq '${runId}'`,
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
