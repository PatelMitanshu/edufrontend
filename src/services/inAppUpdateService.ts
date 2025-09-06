import RNFS from 'react-native-fs';
import { Alert, Linking, Platform } from 'react-native';

export interface DownloadProgress {
	progressPercent: number;
	bytesWritten: number;
	contentLength: number;
}

export async function downloadAndInstallApk({
	downloadUrl,
	version,
	onProgress
}: {
	downloadUrl: string;
	version: string;
	onProgress?: (progress: DownloadProgress) => void;
}): Promise<boolean> {
	if (Platform.OS !== 'android') {
		Alert.alert(
			'Update Available',
			'Please update through the App Store.',
			[
				{ text: 'Cancel', style: 'cancel' },
				{ text: 'Open App Store', onPress: () => Linking.openURL(downloadUrl) }
			]
		);
		return false;
	}

	try {
		const fileName = `edulearn-${version}.apk`;
		const downloadPath = `${RNFS.DownloadDirectoryPath}/${fileName}`;
		if (await RNFS.exists(downloadPath)) {
			await RNFS.unlink(downloadPath);
		}
		Alert.alert('Download Started', `Downloading update v${version}...`);
		const download = RNFS.downloadFile({
			fromUrl: downloadUrl,
			toFile: downloadPath,
			progress: onProgress
				? (res) => {
						const progressPercent = (res.bytesWritten / res.contentLength) * 100;
						onProgress({
							progressPercent,
							bytesWritten: res.bytesWritten,
							contentLength: res.contentLength,
						});
					}
				: undefined,
		});
		const result = await download.promise;
		if (result.statusCode === 200) {
			Alert.alert(
				'Download Complete',
				`Update v${version} downloaded successfully!\n\nFile saved to: Downloads/${fileName}\n\nPlease tap "Install" when the installation screen appears.`,
				[
					{ text: 'Cancel', style: 'cancel' },
					{ text: 'Install Now', onPress: () => installApk(downloadPath) },
				]
			);
			return true;
		}
		throw new Error(`Download failed with status: ${result.statusCode}`);
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		Alert.alert(
			'Download Failed',
			`Failed to download update: ${errorMessage}\n\nYou can download manually from: ${downloadUrl}`,
			[
				{ text: 'OK', style: 'default' },
				{ text: 'Open Browser', onPress: () => Linking.openURL(downloadUrl) },
			]
		);
		return false;
	}
}

async function installApk(filePath: string): Promise<void> {
	try {
		const canInstall = await canInstallApps();
		if (!canInstall) {
			Alert.alert(
				'Installation Permission Required',
				'Enable "Install unknown apps" permission for this app.',
				[
					{ text: 'Cancel', style: 'cancel' },
					{ text: 'Open Settings', onPress: () => openInstallSettings() },
				]
			);
			return;
		}
		const fileUri = `file://${filePath}`;
		const canOpen = await Linking.canOpenURL(fileUri);
		if (canOpen) {
			await Linking.openURL(fileUri);
		} else {
			Alert.alert(
				'Manual Installation Required',
				`Please manually install the APK from:\n${filePath}`,
				[{ text: 'OK' }]
			);
		}
	} catch (error) {
		Alert.alert(
			'Installation Error',
			'Could not start installation. Install the downloaded APK manually.',
			[{ text: 'OK' }]
		);
	}
}

export async function canInstallApps(): Promise<boolean> {
	if (Platform.OS !== 'android') return false;
	try {
		if (Platform.Version >= 26) {
			return false;
		}
		return true;
	} catch {
		return false;
	}
}

export function openInstallSettings(): void {
	if (Platform.OS === 'android') {
		Linking.openSettings();
	}
}
