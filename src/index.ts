import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { ILauncher } from '@jupyterlab/launcher';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { Dialog, showDialog, Clipboard } from '@jupyterlab/apputils';

import { requestAPI } from './handler';

namespace CommandIDs {
  export const createNew = 'getsshpubkey:getssh';
}
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
              body: data.data, //new RenameHandler(oldPath),
              focusNodeSelector: 'input',
              buttons: [
                Dialog.cancelButton({ label: 'Cancel' }),
                Dialog.okButton({ label: 'Copy' }) //add copy not rename
              ]
            }).then(result => {
              console.log(result);
              if (!result.button.accept) {
                return null;
              }
              Clipboard.copyToSystem(data.data);
            })
          )
          .then(result =>
            showDialog({
              body: 'Copied!'
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
