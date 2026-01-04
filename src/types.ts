import type { Formatter } from "picocolors/types";

// ==== Methods Types ====

export interface BundlerOptions {
  release?: boolean;
  embedResources?: boolean;
  copyStorage?: boolean;
  macosBundle?: boolean;
}

export interface RunnerOptions {
  arch?: string;
  argsOpt?: string;
}

export interface WebsocketOptions {
  frontendLibDev?: boolean;
  [key: string]: any;
}



// ==== Modules Types ====

export interface NeuPluginModules {
  bundler: {
    bundleApp: (options: BundlerOptions) => Promise<void>;
  };
  creator: {
    createApp: (appPath: string, template?: string) => Promise<void>;
  };
  downloader: {
    downloadTemplate: (template: string) => Promise<void>;
    downloadAndUpdateBinaries: (latest?: boolean) => Promise<void>;
    downloadAndUpdateClient: (latest?: boolean) => Promise<void>;
    isValidTemplate: (template: string) => Promise<boolean>;
    getRemoteLatestVersion: (repo: string) => Promise<string>;
  };
  runner: {
    runApp: (options: RunnerOptions) => Promise<void>;
  };
  config: {
    update: (key: string, value: any) => void;
    get: () => any;
  };
  websocket: {
    start: (options: WebsocketOptions) => void;
    stop: () => void;
    dispatch: (event: string, data: any) => void;
  };
}


// ==== Create Framework Types ====

export type TemplateInstaller = "vite" | "sv";

export interface TemplateVariant {
  name: string;
  display: string;
  color: Formatter;
  installer?: TemplateInstaller;
  variants?: TemplateVariant[];
}

export interface CreateData {
  projectName: string;
  packageName: string;
  variant: string;
  installer: TemplateInstaller;
  installDependencies: boolean;
  openAppAfterCreation: boolean;
}