import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { ILauncher } from '@jupyterlab/launcher';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { Dialog, showDialog, Clipboard } from '@jupyterlab/apputils';
import React from 'react';

function ShowKeys(sshkey: string, rsakey: string) {
  return React.createElement(
    'div',
    { sshkey, rsakey },
    React.createElement('h4', null, 'SSH key, for use in Github'),
    'See ',
    React.createElement(
      'a',
      {
        href: 'https://docs.github.com/en/authentication/connecting-to-github-with-ssh/adding-a-new-ssh-key-to-your-github-account',
        target: '_blank',
        style: { color: 'grey' }
      },
      'adding ssh key'
    ),
    '.',
    React.createElement('br'),
    React.createElement('br'),

    sshkey,
    React.createElement('br'),
    React.createElement('br'),
    React.createElement('h4', null, 'RSA key, for use in Snowflake'),
    `Run \`call PRODUCTION.PUBLIC.SET_RSA_PUBLIC_KEY('${rsakey
      .split('\n')
      .slice(1, -2)}')\` from a Snowflake worksheet.`
  );
}
//const myWidget = ReactWidget.create(MyComponent());

import { requestAPI } from './handler';

namespace CommandIDs {
  export const createNew = 'getsshpubkey:getssh';
}

const COPY_SSH_LABEL = 'Copy SSH';
const COPY_RSA_LABEL = 'Copy RSA';
/**
 * Initialization data for the getsshpubkey extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'getsshpubkey:plugin',
  autoStart: true,
  optional: [ISettingRegistry, ILauncher],
  activate: (
    app: JupyterFrontEnd,
    settingRegistry: ISettingRegistry | null,
    launcher: ILauncher | null
  ) => {
    console.log('JupyterLab extension getsshpubkey is activated!');
    const { commands } = app;
    const command = CommandIDs.createNew;

    commands.addCommand(command, {
      label: args => (args['isPalette'] ? 'SSH Key' : 'SSH Key'),
      caption: 'SSH Key',
      icon: args => undefined, //(args['isPalette'] ? null : icon),
      execute: async args => {
        requestAPI<any>('get_ssh_pub_key', { method: 'GET' })
          .then(data =>
            showDialog({
              title: 'Public SSH key',
              body: ShowKeys(data.ssh, data.rsa),
              focusNodeSelector: 'input',
              buttons: [
                Dialog.cancelButton({ label: 'Cancel' }),
                Dialog.okButton({ label: COPY_SSH_LABEL }), //add copy not rename
                Dialog.okButton({ label: COPY_RSA_LABEL }) //add copy not rename
              ]
            }).then(result => {
              console.log(result);
              if (!result.button.accept) {
                return null;
              }
              if (result.button.label === COPY_SSH_LABEL) {
                Clipboard.copyToSystem(data.ssh);
              } else if (result.button.label === COPY_RSA_LABEL) {
                Clipboard.copyToSystem(data.rsa);
              } else {
                return null;
              }
              return showDialog({
                body: 'Copied!'
              });
            })
          )
          .catch(reason => {
            console.error(
              `The getsshpubkey server extension appears to be missing.\n${reason}`
            );
          });
      }
    });

    // Add the command to the launcher
    if (launcher) {
      launcher.add({
        command,
        category: 'Other',
        rank: 2
      });
    }

    if (settingRegistry) {
      settingRegistry
        .load(plugin.id)
        .then(settings => {
          console.log('getsshpubkey settings loaded:', settings.composite);
        })
        .catch(reason => {
          console.error('Failed to load settings for getsshpubkey.', reason);
        });
    }
  }
};

export default plugin;
