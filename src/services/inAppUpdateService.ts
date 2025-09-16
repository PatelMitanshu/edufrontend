import RNFS from 'react-native-fs';
import { Alert, Linking, Platform, NativeModules } from 'react-native';

export interface DownloadProgress {
	progressPercent: number;
	bytesWritten: number;
	contentLength: number;
}

// Helper function to open APK file for installation
async function openApkFile(filePath: string): Promise<boolean> {
	try {
		// For Android, use content:// URI scheme for better compatibility
		const fileUri = Platform.OS === 'android' ? 
			`content://com.android.externalstorage.documents/document/primary:${encodeURIComponent('Download/' + filePath.split('/').pop())}` :
			`file://${filePath}`;
		
		console.log('Attempting to open APK:', fileUri);
		
		// First try with content URI
		if (Platform.OS === 'android') {
			try {
				// Try to open with file:// scheme first (more reliable)
				const directFileUri = `file://${filePath}`;
				await Linking.openURL(directFileUri);
				return true;
			} catch (error) {
				console.log('Direct file URI failed, trying alternative method:', error);
				
				// Fallback: Guide user to manual installation
				Alert.alert(
					'Install Update',
					`Download completed! Please install the update manually:\n\n1. Open your Downloads folder\n2. Find "${filePath.split('/').pop()}"\n3. Tap to install\n\nMake sure "Install unknown apps" is enabled for your file manager.`,
					[
						{ text: 'Open Downloads', onPress: () => Linking.openURL('content://com.android.externalstorage.documents/document/primary:Download') },
						{ text: 'Open Settings', onPress: () => openInstallSettings() },
						{ text: 'OK', style: 'default' }
					]
				);
				return false;
			}
		}
		
		return false;
	} catch (error) {
		console.error('Error opening APK file:', error);
		return false;
	}
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
			// Validate that we actually downloaded an APK file, not HTML
			const fileExists = await RNFS.exists(downloadPath);
			if (!fileExists) {
				throw new Error('Downloaded file not found');
			}

			// Check file size - APK should be at least 1MB, HTML pages are usually much smaller
			const fileStat = await RNFS.stat(downloadPath);
			if (fileStat.size < 1024 * 1024) { // Less than 1MB
				Alert.alert(
					'Download Error',
					'The downloaded file appears to be invalid. This usually means:\n\n• The download URL is incorrect\n• The APK file is not available\n• Network connectivity issues\n\nPlease contact support or try again later.',
					[{ text: 'OK' }]
				);
				// Clean up invalid file
				await RNFS.unlink(downloadPath);
				return false;
			}

			// Check if file starts with APK signature (optional additional validation)
			try {
				const fileHeader = await RNFS.read(downloadPath, 4, 0, 'base64');
				// APK files start with "PK" (ZIP signature) - base64 encoded should start with "UEs"
				if (!fileHeader.startsWith('UEs')) {
					Alert.alert(
						'Invalid File Format',
						'The downloaded file is not a valid APK package. This usually means the download URL is pointing to a web page instead of the APK file.\n\nPlease contact the app developer to fix the download link.',
						[{ text: 'OK' }]
					);
					await RNFS.unlink(downloadPath);
					return false;
				}
			} catch (headerCheckError) {
				console.warn('Could not validate APK header:', headerCheckError);
				// Continue anyway if header check fails
			}

			Alert.alert(
				'Download Complete! 📱',
				`Update v${version} downloaded successfully!\n\n🔧 Installation Steps:\n1. Tap "Install Now" below\n2. Enable "Install unknown apps" if prompted\n3. Follow the installation prompts\n\n📁 File location: Downloads/${fileName}`,
				[
					{ text: 'Later', style: 'cancel' },
					{ 
						text: 'Install Now', 
						onPress: async () => {
							await installApk(downloadPath);
							// Show additional help after installation attempt
							setTimeout(() => {
								Alert.alert(
									'Installation Help',
									'If installation didn\'t start:\n\n1. Go to Settings > Apps > Special access > Install unknown apps\n2. Find this app and enable "Allow from this source"\n3. Try installation again',
									[
										{ text: 'Open Settings', onPress: () => openInstallSettings() },
										{ text: 'OK' }
									]
								);
							}, 2000);
						}
					},
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

async function installApk(filePath: string): Promise<boolean> {
	try {
		console.log('Starting APK installation for:', filePath);
		
		// Check if file exists
		const fileExists = await RNFS.exists(filePath);
		if (!fileExists) {
			Alert.alert('Error', 'APK file not found. Please download again.');
			return false;
		}
		
		// Show pre-installation guidance
		Alert.alert(
			'Enable Installation Permission',
			'To install the update, please:\n\n1️⃣ Tap "Open Settings" below\n2️⃣ Look for "Install unknown apps" or "Special app access"\n3️⃣ Find "EduLearn" in the list\n4️⃣ Enable "Allow from this source"\n5️⃣ Return to the app and try again\n\n📱 If you don\'t see the option, look for "Security" or "Privacy" settings.',
			[
				{ text: 'Cancel', style: 'cancel' },
				{ 
					text: 'Open Settings', 
					onPress: async () => {
						await openInstallSettings();
						// Give user some time to enable permission
						setTimeout(async () => {
							const opened = await openApkFile(filePath);
							if (!opened) {
								showManualInstallGuide(filePath);
							}
						}, 3000);
					}
				}
			]
		);
		return true;
	} catch (error) {
		console.error('Installation error:', error);
		Alert.alert(
			'Installation Error',
			'Could not start installation. Please install the downloaded APK manually from your Downloads folder.',
			[
				{ text: 'Open Downloads', onPress: () => openDownloadsFolder() },
				{ text: 'OK' }
			]
		);
		return false;
	}
}

export async function canInstallApps(): Promise<boolean> {
	if (Platform.OS !== 'android') return false;
	try {
		// For Android 8.0 and above, we need special permission
		if (Platform.Version >= 26) {
			// We can't directly check this permission, so we'll return true
			// and let the installation attempt handle the permission request
			return true;
		}
		return true;
	} catch {
		return false;
	}
}

export async function openInstallSettings(): Promise<void> {
	if (Platform.OS === 'android') {
		try {
			// Try to open the specific "Install unknown apps" settings page
			const canOpenUnknownApps = await Linking.canOpenURL('android.settings.MANAGE_UNKNOWN_APP_SOURCES');
			if (canOpenUnknownApps) {
				await Linking.openURL('android.settings.MANAGE_UNKNOWN_APP_SOURCES');
				return;
			}

			// Fallback 1: Try to open with package name
			const packageName = NativeModules.PlatformConstants?.PackageName || 'com.ubarcloan';
			const packageSpecificUrl = `android.settings.MANAGE_UNKNOWN_APP_SOURCES?package=${packageName}`;
			const canOpenPackageSpecific = await Linking.canOpenURL(packageSpecificUrl);
			if (canOpenPackageSpecific) {
				await Linking.openURL(packageSpecificUrl);
				return;
			}

			// Fallback 2: Open general security settings
			const securityUrl = 'android.settings.SECURITY_SETTINGS';
			const canOpenSecurity = await Linking.canOpenURL(securityUrl);
			if (canOpenSecurity) {
				await Linking.openURL(securityUrl);
				return;
			}

			// Final fallback: general app settings
			Linking.openSettings();
		} catch (error) {
			console.error('Error opening install settings:', error);
			// Final fallback to general app settings
			Linking.openSettings();
		}
	}
}

// Helper function to open Downloads folder
function openDownloadsFolder(): void {
	try {
		// Try to open Downloads folder directly
		Linking.openURL('content://com.android.externalstorage.documents/document/primary:Download');
	} catch (error) {
		// Fallback to file manager
		try {
			Linking.openURL('content://com.android.documentsui/.MainActivity');
		} catch (fallbackError) {
			Alert.alert('Info', 'Please open your file manager and navigate to the Downloads folder.');
		}
	}
}

// Helper function to show manual installation guide
function showManualInstallGuide(filePath: string): void {
	const fileName = filePath.split('/').pop() || 'app-update.apk';
	Alert.alert(
		'Manual Installation Guide 📱',
		`Installation Steps:\n\n📁 STEP 1: Find the APK\n• File location: Downloads folder\n• File name: ${fileName}\n\n⚙️ STEP 2: Enable Permission\n• Settings → Apps → Special access\n• Find "Install unknown apps"\n• Enable for "EduLearn"\n\n📱 STEP 3: Install\n• Open Downloads folder\n• Tap the APK file\n• Follow installation prompts\n\n💡 Note: The permission might be under "Security" or "Privacy" settings on some devices.`,
		[
			{ text: 'Open Downloads', onPress: () => openDownloadsFolder() },
			{ text: 'Open Settings', onPress: () => openInstallSettings() },
			{ text: 'Got it!' }
		]
	);
}

// Helper function to show installation help
function showInstallationHelp(): void {
	Alert.alert(
		'Installation Help 📱',
		'Step-by-step guide:\n\n1️⃣ Download completed in Downloads folder\n\n2️⃣ Open Downloads & find the APK file\n\n3️⃣ Tap the APK file to start installation\n\n4️⃣ If blocked:\n   • Tap "Settings" button\n   • Enable "Allow from this source"\n   • Return and tap "Install"\n\n5️⃣ Complete the installation process',
		[
			{ text: 'Open Settings', onPress: () => openInstallSettings() },
			{ text: 'Open Downloads', onPress: () => openDownloadsFolder() },
			{ text: 'Got it!' }
		]
	);
}
