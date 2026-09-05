export interface ArchiveMediaAsset {
  readonly id: string;
  readonly type: 'image' | 'video';
  readonly url: string;
  readonly poster?: string;
  readonly alt: string;
  readonly width: number;
  readonly height: number;
  readonly caption?: string;
}

export interface ArchiveEntry {
  readonly id: string;
  readonly date: string;
  readonly formattedDate: string;
  readonly title: string;
  readonly category: string;
  readonly text: string[];
  readonly specs?: readonly { label: string; value: string }[];
  readonly assets: readonly ArchiveMediaAsset[];
}

export interface ArchiveProject {
  readonly title: string;
  readonly year: string;
  readonly status: string;
  readonly wipTag: string;
  readonly subtitle: string;
  readonly author: string;
  readonly location: string;
  readonly entries: readonly ArchiveEntry[];
}
